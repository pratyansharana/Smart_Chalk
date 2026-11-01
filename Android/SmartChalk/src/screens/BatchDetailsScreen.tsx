import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AttachmentViewer } from '../components/AttachmentViewer';
import { RichContent } from '../components/RichContent';
import { auth, db, storage } from '../config/firebaseconfig';
import type { RootStackScreenProps } from '../navigation/types';

type ScreenProps = RootStackScreenProps<'BatchDetails'>;
type TabKey = 'announcements' | 'vault' | 'assignments' | 'tests' | 'quizzes' | 'study';
type DocumentAsset = DocumentPicker.DocumentPickerAsset;
type FirestoreItem = { id: string; [key: string]: unknown };
type Batch = FirestoreItem & {
  title?: string;
  subject?: string;
  schedule?: string;
  status?: string;
  meetingLink?: string;
  studentIds?: string[];
  notes?: { id: string; text: string; createdAt?: string }[];
};
type QuizQuestion = { questionText: string; options: string[]; correctOptionIndex: number };
type Quiz = FirestoreItem & { title?: string; questions?: QuizQuestion[] };
type SelfStudyWorksheet = FirestoreItem & {
  title?: string;
  description?: string;
  level?: string;
  status?: string;
  questionsContent?: string;
  grade?: number;
  feedback?: string;
  studentAnswersText?: string;
  createdAt?: unknown;
};

const TABS: { key: TabKey; label: string; description: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: 'announcements', label: 'Updates', description: 'Teacher announcements', icon: 'bullhorn-outline' },
  { key: 'assignments', label: 'Assignments', description: 'View and submit classwork', icon: 'file-document-outline' },
  { key: 'tests', label: 'Tests', description: 'Papers, submissions, and grades', icon: 'clipboard-text-outline' },
  { key: 'quizzes', label: 'Quizzes', description: 'Practice and batch leaderboard', icon: 'trophy-outline' },
  { key: 'study', label: 'Study', description: 'Worksheets and AI feedback', icon: 'brain' },
  { key: 'vault', label: 'Vault', description: 'Shared class resources', icon: 'folder-open-outline' },
];

function watchList<T extends FirestoreItem>(
  collectionName: string,
  field: string,
  value: string,
  onData: (items: T[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    query(collection(db, collectionName), where(field, '==', value)),
    (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T)),
    onError,
  );
}

function formatDate(value: unknown) {
  if (!value) return 'Date pending';
  const date = typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function'
    ? value.toDate()
    : new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? 'Date pending' : date.toLocaleDateString();
}

export default function BatchDetailsScreen({ route, navigation }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { batchId } = route.params;
  const studentId = auth.currentUser?.uid || '';
  const studentName = auth.currentUser?.displayName || auth.currentUser?.email || 'Student';
  const [batchState, setBatchState] = useState<{ batchId: string | null; data: Batch | null; loading: boolean; error: string }>({ batchId: null, data: null, loading: true, error: '' });
  const [assignments, setAssignments] = useState<FirestoreItem[]>([]);
  const [submissions, setSubmissions] = useState<FirestoreItem[]>([]);
  const [tests, setTests] = useState<FirestoreItem[]>([]);
  const [testSubmissions, setTestSubmissions] = useState<FirestoreItem[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizScores, setQuizScores] = useState<FirestoreItem[]>([]);
  const [vaultItems, setVaultItems] = useState<FirestoreItem[]>([]);
  const [activeAttachment, setActiveAttachment] = useState<{ uri: string; name: string } | null>(null);
  const [worksheets, setWorksheets] = useState<SelfStudyWorksheet[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey | null>(route.params.initialTab || null);
  const [activeWorksheetId, setActiveWorksheetId] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [selectedTestId, setSelectedTestId] = useState('');
  const [includeCompletedAssignments, setIncludeCompletedAssignments] = useState(false);
  const [includeCompletedTests, setIncludeCompletedTests] = useState(false);
  const [filesByKey, setFilesByKey] = useState<Record<string, DocumentAsset[]>>({});
  const [uploadingKey, setUploadingKey] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [resourceFile, setResourceFile] = useState<DocumentAsset | null>(null);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [activeQuizId, setActiveQuizId] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  useEffect(() => {
    if (!studentId) return undefined;
    const handleError = (error: Error) => {
      setBatchState({ batchId, data: null, loading: false, error: error.message });
    };
    const unsubscribeBatch = onSnapshot(
      doc(db, 'classes', batchId),
      (snapshot) => {
        setBatchState({
          batchId,
          data: snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Batch) : null,
          loading: false,
          error: '',
        });
      },
      handleError,
    );
    const unsubscribeAssignments = watchList('assignments', 'classId', batchId, setAssignments, handleError);
    const unsubscribeSubmissions = watchList('submissions', 'studentId', studentId, setSubmissions, handleError);
    const unsubscribeTests = watchList('tests', 'classId', batchId, setTests, handleError);
    const unsubscribeTestSubmissions = watchList('test_submissions', 'studentId', studentId, setTestSubmissions, handleError);
    const unsubscribeQuizzes = watchList<Quiz>('quizzes', 'classId', batchId, setQuizzes, handleError);
    const unsubscribeQuizScores = watchList('quiz_submissions', 'classId', batchId, setQuizScores, handleError);
    const unsubscribeVault = watchList('vault_items', 'classId', batchId, setVaultItems, handleError);
    const unsubscribeWorksheets = onSnapshot(
      query(
        collection(db, 'self_study_worksheets'),
        where('studentId', '==', studentId),
        where('classId', '==', batchId),
      ),
      (snapshot) => setWorksheets(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as SelfStudyWorksheet)),
      handleError,
    );

    return () => {
      unsubscribeBatch();
      unsubscribeAssignments();
      unsubscribeSubmissions();
      unsubscribeTests();
      unsubscribeTestSubmissions();
      unsubscribeQuizzes();
      unsubscribeQuizScores();
      unsubscribeVault();
      unsubscribeWorksheets();
    };
  }, [batchId, studentId]);

  const batchIsCurrent = batchState.batchId === batchId;
  const batch = batchIsCurrent ? batchState.data : null;
  const loading = !batchIsCurrent || batchState.loading;
  const loadError = batchIsCurrent ? batchState.error : '';

  const assignmentSubmissionById = useMemo(
    () => new Map(submissions.map((submission) => [submission.assignmentId, submission])),
    [submissions],
  );
  const quiz = quizzes.find((item) => item.id === activeQuizId);
  const activeWorksheet = worksheets.find((item) => item.id === activeWorksheetId);
  const questions = quiz?.questions || [];
  const currentQuestion = questions[questionIndex];

  useEffect(() => {
    if (!activeQuizId || quizFinished || questionAnswered) return undefined;
    const timer = setInterval(() => {
      setTimeLeft((remaining) => {
        if (remaining <= 1) {
          setQuestionAnswered(true);
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuizId, questionIndex, quizFinished, questionAnswered]);

  async function selectFiles(key: string, multiple = true) {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple,
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        setFilesByKey((current) => ({ ...current, [key]: result.assets }));
      }
    } catch (error) {
      Alert.alert('Unable to select files', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  async function selectResourceFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled) setResourceFile(result.assets[0] || null);
    } catch (error) {
      Alert.alert('Unable to select file', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  async function uploadFiles(key: string, folder: string) {
    if (!storage) throw new Error('Firebase Storage is not configured.');
    const files = filesByKey[key] || [];
    const uploaded: { fileURL: string; fileName: string }[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
      const task = uploadBytesResumable(storageRef, blob, {
        contentType: file.mimeType || 'application/octet-stream',
      });
      const fileURL = await new Promise<string>((resolve, reject) => {
        task.on(
          'state_changed',
          (snapshot) => setUploadProgress(Math.round(((index + snapshot.bytesTransferred / snapshot.totalBytes) / files.length) * 100)),
          reject,
          () => getDownloadURL(task.snapshot.ref).then(resolve, reject),
        );
      });
      uploaded.push({ fileURL, fileName: file.name });
    }
    return uploaded;
  }

  async function submitAssignment(assignment: FirestoreItem) {
    const key = `assignment-${assignment.id}`;
    if (!filesByKey[key]?.length) {
      Alert.alert('Choose a solution', 'Select a PDF or image before submitting.');
      return;
    }
    setUploadingKey(key);
    setUploadProgress(0);
    try {
      const uploadedFiles = await uploadFiles(key, `submissions/${assignment.id}/${studentId}`);
      const submissionId = `${assignment.id}_${studentId}`;
      await setDoc(doc(db, 'submissions', submissionId), {
        id: submissionId,
        assignmentId: assignment.id,
        studentId,
        submittedFileURL: uploadedFiles[0]?.fileURL || null,
        submittedFileName: uploadedFiles[0]?.fileName || null,
        submittedFiles: uploadedFiles,
        status: 'submitted',
        grade: null,
        feedback: null,
        gradedAt: null,
        gradedBy: null,
        submittedAt: serverTimestamp(),
      }, { merge: true });
      setFilesByKey((current) => ({ ...current, [key]: [] }));
      Alert.alert('Submitted', 'Your worksheet was uploaded successfully.');
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUploadingKey('');
    }
  }

  async function submitTest(test: FirestoreItem) {
    const key = `test-${test.id}`;
    const answerText = testAnswers[test.id]?.trim() || '';
    if (!filesByKey[key]?.length && !answerText) {
      Alert.alert('Add your solution', 'Choose a file or enter your written answers.');
      return;
    }
    setUploadingKey(key);
    setUploadProgress(0);
    try {
      const uploadedFiles = filesByKey[key]?.length
        ? await uploadFiles(key, `test_submissions/${Date.now()}`)
        : [];
      const payload = {
        testId: test.id,
        classId: batchId,
        studentId,
        studentName,
        submittedFileURL: uploadedFiles[0]?.fileURL || null,
        submittedFileName: uploadedFiles[0]?.fileName || null,
        submittedFiles: uploadedFiles,
        studentText: answerText || null,
        status: 'submitted',
        grade: null,
        feedback: null,
        gradedBy: null,
        gradedAt: null,
        submittedAt: serverTimestamp(),
      };
      const existingSubmission = testSubmissions.find((item) => item.testId === test.id && item.classId === batchId);
      if (existingSubmission?.status === 'resubmit_requested') {
        await updateDoc(doc(db, 'test_submissions', existingSubmission.id), payload);
      } else {
        await addDoc(collection(db, 'test_submissions'), payload);
      }
      setFilesByKey((current) => ({ ...current, [key]: [] }));
      setTestAnswers((current) => ({ ...current, [test.id]: '' }));
      Alert.alert('Submitted', 'Your test solution was sent for review.');
    } catch (error) {
      Alert.alert('Submission failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUploadingKey('');
    }
  }

  async function publishVaultResource() {
    if (!resourceTitle.trim()) {
      Alert.alert('Add a title', 'A title is required to share a resource.');
      return;
    }
    setUploadingKey('vault');
    setUploadProgress(0);
    try {
      let uploadedFiles: { fileURL: string; fileName: string }[] = [];
      if (resourceFile) {
        setFilesByKey((current) => ({ ...current, vault: [resourceFile] }));
        const response = await fetch(resourceFile.uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `vault/${Date.now()}/${resourceFile.name}`);
        const task = uploadBytesResumable(storageRef, blob, { contentType: resourceFile.mimeType || 'application/octet-stream' });
        const fileURL = await new Promise<string>((resolve, reject) => {
          task.on('state_changed', (snapshot) => setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)), reject, () => getDownloadURL(task.snapshot.ref).then(resolve, reject));
        });
        uploadedFiles = [{ fileURL, fileName: resourceFile.name }];
      }
      await addDoc(collection(db, 'vault_items'), {
        classId: batchId,
        title: resourceTitle.trim(),
        description: resourceDescription.trim(),
        fileURL: uploadedFiles[0]?.fileURL || '',
        fileName: uploadedFiles[0]?.fileName || '',
        uploadedBy: studentId,
        uploadedByName: studentName,
        isStudentUpload: true,
        createdAt: serverTimestamp(),
      });
      setResourceTitle('');
      setResourceDescription('');
      setResourceFile(null);
      Alert.alert('Shared', 'Your resource is now available in the batch vault.');
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUploadingKey('');
    }
  }

  function startQuiz(quizId: string) {
    setActiveQuizId(quizId);
    setQuestionIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setQuestionAnswered(false);
    setTimeLeft(30);
    setQuizFinished(false);
  }

  async function advanceQuiz() {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((current) => current + 1);
      setSelectedOption(null);
      setQuestionAnswered(false);
      setTimeLeft(30);
      return;
    }
    setQuizSubmitting(true);
    try {
      await addDoc(collection(db, 'quiz_submissions'), {
        quizId: activeQuizId,
        classId: batchId,
        studentId,
        studentName,
        score: quizScore,
        totalQuestions: questions.length,
        submittedAt: serverTimestamp(),
      });
      setQuizFinished(true);
    } catch (error) {
      Alert.alert('Could not submit score', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setQuizSubmitting(false);
    }
  }

  if (!studentId) {
    return <View style={[styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}><Text style={styles.mutedText}>Sign in to view this class.</Text></View>;
  }

  if (loading) {
    return <View style={[styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}><Text style={styles.mutedText}>Loading class workspace...</Text></View>;
  }

  if (!batch || loadError) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.errorTitle}>Class unavailable</Text>
        <Text style={styles.mutedText}>{loadError || 'This batch could not be found.'}</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Back to classes</Text>
        </Pressable>
      </View>
    );
  }

  if (!batch.studentIds?.includes(studentId)) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.errorTitle}>Enrollment pending</Text>
        <Text style={styles.mutedText}>This workspace opens after your teacher approves the join request.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Back to classes</Text>
        </Pressable>
      </View>
    );
  }

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Unable to open link', 'Check the link and try again.'));
  };

  const openAttachment = (url: string, name?: string) => {
    setActiveAttachment({ uri: url, name: name || url.split('?')[0].split('/').pop() || 'Attachment' });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={19} color="#4E6478" />
          <Text style={styles.backText}>Classes</Text>
        </Pressable>

        <View style={styles.batchHeader}>
          <View style={styles.headerTop}>
            <Text style={styles.subject}>{batch.subject || 'CLASS BATCH'}</Text>
            {batch.status === 'live' && <Text style={styles.liveBadge}>LIVE NOW</Text>}
          </View>
          <Text style={styles.batchTitle}>{batch.title || 'Class workspace'}</Text>
          <Text style={styles.batchSchedule}>{batch.schedule || 'Schedule pending'}</Text>
          {!!batch.meetingLink && (
            <Pressable onPress={() => openLink(batch.meetingLink || '')} style={styles.meetingButton}>
              <MaterialCommunityIcons name="video-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>{batch.status === 'live' ? 'Join live session' : 'Open class link'}</Text>
            </Pressable>
          )}
        </View>

        {activeTab === null ? (
          <View style={styles.tileGrid}>
            {TABS.map((tab) => {
              const count = tab.key === 'announcements' ? batch.notes?.length || 0
                : tab.key === 'assignments' ? assignments.length
                  : tab.key === 'tests' ? tests.length
                    : tab.key === 'quizzes' ? quizzes.length
                      : tab.key === 'study' ? worksheets.length
                        : vaultItems.length;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => {
                    setSelectedAssignmentId('');
                    setSelectedTestId('');
                    setActiveWorksheetId('');
                    setActiveQuizId('');
                    setActiveTab(tab.key);
                  }}
                  style={styles.hubTile}
                >
                  <View style={styles.tileIcon}>
                    <MaterialCommunityIcons name={tab.icon} size={22} color="#2D66C8" />
                  </View>
                  <Text style={styles.tileTitle}>{tab.label}</Text>
                  <Text style={styles.tileDescription}>{tab.description}</Text>
                  <Text style={styles.tileCount}>{count} {count === 1 ? 'item' : 'items'}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.sectionBackRow}>
            <Pressable onPress={() => {
              setSelectedAssignmentId('');
              setSelectedTestId('');
              setActiveWorksheetId('');
              setActiveQuizId('');
              setActiveTab(null);
            }} style={styles.sectionBackButton}>
              <MaterialCommunityIcons name="arrow-left" size={18} color="#2D66C8" />
              <Text style={styles.sectionBackText}>Batch overview</Text>
            </Pressable>
            <Text style={styles.sectionName}>{TABS.find((tab) => tab.key === activeTab)?.label}</Text>
          </View>
        )}

        {activeTab === 'announcements' && (
          <View style={styles.section}>
            <SectionHeading icon="bullhorn-outline" title="Teacher updates" />
            {batch.notes?.length ? batch.notes.map((note) => (
              <View key={note.id} style={styles.contentRow}>
                <RichContent content={note.text} />
                <Text style={styles.metaText}>{formatDate(note.createdAt)}</Text>
              </View>
            )) : <EmptyState text="No announcements have been posted for this class yet." />}
          </View>
        )}

        {activeTab === 'vault' && (
          <View style={styles.section}>
            <SectionHeading icon="folder-open-outline" title="Batch vault" />
            {vaultItems.map((item) => (
              <View key={item.id} style={styles.contentRow}>
                <Text style={styles.itemTitle}>{String(item.title || 'Shared resource')}</Text>
                <RichContent content={String(item.description || '')} />
                <Text style={styles.metaText}>{item.isStudentUpload ? `Shared by ${String(item.uploadedByName || 'student')}` : 'Shared by teacher'}</Text>
                {typeof item.fileURL === 'string' && item.fileURL ? (
                  <Pressable onPress={() => openAttachment(item.fileURL as string, String(item.fileName || ''))} style={styles.inlineAction}>
                    <MaterialCommunityIcons name="download-outline" size={17} color="#2D66C8" />
                    <Text style={styles.inlineActionText}>{String(item.fileName || 'Open attachment')}</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
            {!vaultItems.length && <EmptyState text="Your teacher has not shared any resources yet." />}
            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Share a resource with the class</Text>
              <TextInput value={resourceTitle} onChangeText={setResourceTitle} placeholder="Resource title" placeholderTextColor="#91A0AE" style={styles.input} />
              <TextInput value={resourceDescription} onChangeText={setResourceDescription} placeholder="Description (optional)" placeholderTextColor="#91A0AE" style={styles.input} />
              <View style={styles.actionRow}>
                <Pressable onPress={selectResourceFile} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>{resourceFile?.name || 'Attach file'}</Text>
                </Pressable>
                <Pressable disabled={uploadingKey === 'vault'} onPress={publishVaultResource} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>{uploadingKey === 'vault' ? `Uploading ${uploadProgress}%` : 'Share'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'assignments' && (
          <View style={styles.section}>
            <SectionHeading icon="file-document-outline" title="Assignments" />
            {selectedAssignmentId ? (() => {
              const assignment = assignments.find((item) => item.id === selectedAssignmentId);
              if (!assignment) return <EmptyState text="This assignment is no longer available." />;
              const submission = assignmentSubmissionById.get(assignment.id);
              const key = `assignment-${assignment.id}`;
              return (
                <View style={styles.contentRow}>
                  <Pressable onPress={() => setSelectedAssignmentId('')} style={styles.inlineAction}>
                    <MaterialCommunityIcons name="arrow-left" size={17} color="#2D66C8" />
                    <Text style={styles.inlineActionText}>All assignments</Text>
                  </Pressable>
                  <Text style={styles.itemTitle}>{String(assignment.title || 'Assignment')}</Text>
                  <RichContent content={String(assignment.description || assignment.subject || '')} />
                  <Text style={styles.metaText}>Due {formatDate(assignment.dueDate)}  ·  Max score {String(assignment.maxScore || 100)}</Text>
                  {typeof assignment.worksheetFileURL === 'string' && assignment.worksheetFileURL ? (
                    <Pressable onPress={() => openAttachment(assignment.worksheetFileURL as string, `${String(assignment.title || 'Worksheet')}.pdf`)} style={styles.inlineAction}>
                      <MaterialCommunityIcons name="download-outline" size={17} color="#2D66C8" />
                      <Text style={styles.inlineActionText}>Download worksheet</Text>
                    </Pressable>
                  ) : null}
                  {submission ? (
                    <View style={styles.submissionState}>
                      <Text style={styles.statusText}>{submission.grade === null || submission.grade === undefined ? 'Submitted for review' : `Score: ${String(submission.grade)} / ${String(assignment.maxScore || 100)}`}</Text>
                      {typeof submission.feedback === 'string' && submission.feedback ? <RichContent content={submission.feedback} /> : null}
                      {typeof submission.submittedFileURL === 'string' && submission.submittedFileURL ? (
                        <Pressable onPress={() => openAttachment(submission.submittedFileURL as string, String(submission.submittedFileName || 'Solution'))} style={styles.inlineAction}>
                          <MaterialCommunityIcons name="file-eye-outline" size={17} color="#2D66C8" />
                          <Text style={styles.inlineActionText}>{String(submission.submittedFileName || 'View submitted solution')}</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : (
                    <View style={styles.uploadArea}>
                      <Pressable onPress={() => selectFiles(key)} style={styles.secondaryButton}>
                        <Text style={styles.secondaryButtonText}>{filesByKey[key]?.length ? `${filesByKey[key].length} file(s) selected` : 'Choose solution files'}</Text>
                      </Pressable>
                      {filesByKey[key]?.length ? <Pressable disabled={uploadingKey === key} onPress={() => submitAssignment(assignment)} style={styles.primaryButton}>
                        <Text style={styles.primaryButtonText}>{uploadingKey === key ? `Uploading ${uploadProgress}%` : 'Submit'}</Text>
                      </Pressable> : null}
                    </View>
                  )}
                </View>
              );
            })() : (
              <>
                {assignments.some((item) => assignmentSubmissionById.has(item.id)) ? (
                  <Pressable onPress={() => setIncludeCompletedAssignments((value) => !value)} style={styles.filterToggle}>
                    <MaterialCommunityIcons name={includeCompletedAssignments ? 'checkbox-marked-outline' : 'checkbox-blank-outline'} size={19} color="#2D66C8" />
                    <Text style={styles.filterToggleText}>{includeCompletedAssignments ? 'Hide completed' : `Show completed (${assignments.filter((item) => assignmentSubmissionById.has(item.id)).length})`}</Text>
                  </Pressable>
                ) : null}
                {assignments.filter((item) => includeCompletedAssignments || !assignmentSubmissionById.has(item.id)).map((assignment) => {
                  const complete = assignmentSubmissionById.has(assignment.id);
                  return (
                    <Pressable key={assignment.id} onPress={() => setSelectedAssignmentId(assignment.id)} style={styles.titleRow}>
                      <MaterialCommunityIcons name={complete ? 'check-circle-outline' : 'circle-outline'} size={19} color={complete ? '#287E52' : '#2D66C8'} />
                      <Text style={styles.titleRowText} numberOfLines={2}>{String(assignment.title || 'Assignment')}</Text>
                      <MaterialCommunityIcons name="chevron-right" size={19} color="#98A5B2" />
                    </Pressable>
                  );
                })}
                {!assignments.length && <EmptyState text="No assignments have been published for this class." />}
                {!!assignments.length && !includeCompletedAssignments && assignments.every((item) => assignmentSubmissionById.has(item.id)) ? <EmptyState text="All assignments are complete. Show completed to review them." /> : null}
              </>
            )}
          </View>
        )}

        {activeTab === 'tests' && (
          <View style={styles.section}>
            <SectionHeading icon="clipboard-text-outline" title="Test centre" />
            {selectedTestId ? (() => {
              const test = tests.find((item) => item.id === selectedTestId);
              if (!test) return <EmptyState text="This test is no longer available." />;
              const submission = testSubmissions.find((item) => item.testId === test.id && item.classId === batchId);
              const key = `test-${test.id}`;
              return (
                <View style={styles.contentRow}>
                  <Pressable onPress={() => setSelectedTestId('')} style={styles.inlineAction}>
                    <MaterialCommunityIcons name="arrow-left" size={17} color="#2D66C8" />
                    <Text style={styles.inlineActionText}>All tests</Text>
                  </Pressable>
                  <Text style={styles.itemTitle}>{String(test.title || 'Class test')}</Text>
                  <RichContent content={String(test.description || '')} />
                  <Text style={styles.metaText}>Due {formatDate(test.dueDate)}  ·  Max score {String(test.maxScore || 100)}</Text>
                  {typeof test.testContent === 'string' && test.testContent ? <RichContent content={test.testContent} /> : null}
                  {typeof test.testFileURL === 'string' && test.testFileURL ? (
                    <Pressable onPress={() => openAttachment(test.testFileURL as string, `${String(test.title || 'Test')}.pdf`)} style={styles.inlineAction}>
                      <MaterialCommunityIcons name="download-outline" size={17} color="#2D66C8" />
                      <Text style={styles.inlineActionText}>Open test paper</Text>
                    </Pressable>
                  ) : null}
                  {submission && submission.status !== 'resubmit_requested' ? (
                    <View style={styles.submissionState}>
                      <Text style={styles.statusText}>{submission.status === 'graded' ? `Graded: ${String(submission.grade)} / ${String(test.maxScore || 100)}` : 'Submitted for grading'}</Text>
                      {typeof submission.feedback === 'string' && submission.feedback ? <RichContent content={submission.feedback} /> : null}
                      {typeof submission.submittedFileURL === 'string' && submission.submittedFileURL ? (
                        <Pressable onPress={() => openAttachment(submission.submittedFileURL as string, String(submission.submittedFileName || 'Solution'))} style={styles.inlineAction}>
                          <MaterialCommunityIcons name="file-eye-outline" size={17} color="#2D66C8" />
                          <Text style={styles.inlineActionText}>{String(submission.submittedFileName || 'View submitted solution')}</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : (
                    <View style={styles.uploadArea}>
                      {submission?.status === 'resubmit_requested' ? (
                        <View style={styles.warningBox}>
                          <Text style={styles.warningTitle}>Teacher requested a resubmission</Text>
                          <RichContent content={String(submission.feedback || 'Review your answers and submit again.')} />
                        </View>
                      ) : null}
                      <TextInput
                        multiline
                        value={testAnswers[test.id] || ''}
                        onChangeText={(value) => setTestAnswers((current) => ({ ...current, [test.id]: value }))}
                        placeholder="Write your answers here (optional if attaching files)"
                        placeholderTextColor="#91A0AE"
                        style={[styles.input, styles.answerInput]}
                      />
                      <View style={styles.actionRow}>
                        <Pressable onPress={() => selectFiles(key)} style={styles.secondaryButton}>
                          <Text style={styles.secondaryButtonText}>{filesByKey[key]?.length ? `${filesByKey[key].length} file(s) selected` : 'Attach solution'}</Text>
                        </Pressable>
                        <Pressable disabled={uploadingKey === key} onPress={() => submitTest(test)} style={styles.primaryButton}>
                          <Text style={styles.primaryButtonText}>{uploadingKey === key ? `Uploading ${uploadProgress}%` : 'Submit test'}</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              );
            })() : (
              <>
                {tests.some((test) => {
                  const submission = testSubmissions.find((item) => item.testId === test.id && item.classId === batchId);
                  return Boolean(submission && submission.status !== 'resubmit_requested');
                }) ? (
                  <Pressable onPress={() => setIncludeCompletedTests((value) => !value)} style={styles.filterToggle}>
                    <MaterialCommunityIcons name={includeCompletedTests ? 'checkbox-marked-outline' : 'checkbox-blank-outline'} size={19} color="#2D66C8" />
                    <Text style={styles.filterToggleText}>{includeCompletedTests ? 'Hide completed' : `Show completed (${tests.filter((test) => {
                      const submission = testSubmissions.find((item) => item.testId === test.id && item.classId === batchId);
                      return Boolean(submission && submission.status !== 'resubmit_requested');
                    }).length})`}</Text>
                  </Pressable>
                ) : null}
                {tests.filter((test) => {
                  const submission = testSubmissions.find((item) => item.testId === test.id && item.classId === batchId);
                  const complete = Boolean(submission && submission.status !== 'resubmit_requested');
                  return includeCompletedTests || !complete;
                }).map((test) => {
                  const submission = testSubmissions.find((item) => item.testId === test.id && item.classId === batchId);
                  const complete = Boolean(submission && submission.status !== 'resubmit_requested');
                  return (
                    <Pressable key={test.id} onPress={() => setSelectedTestId(test.id)} style={styles.titleRow}>
                      <MaterialCommunityIcons name={complete ? 'check-circle-outline' : 'circle-outline'} size={19} color={complete ? '#287E52' : '#2D66C8'} />
                      <Text style={styles.titleRowText} numberOfLines={2}>{String(test.title || 'Class test')}</Text>
                      <MaterialCommunityIcons name="chevron-right" size={19} color="#98A5B2" />
                    </Pressable>
                  );
                })}
                {!tests.length && <EmptyState text="No tests have been scheduled for this class." />}
                {!!tests.length && !includeCompletedTests && tests.every((test) => {
                  const submission = testSubmissions.find((item) => item.testId === test.id && item.classId === batchId);
                  return Boolean(submission && submission.status !== 'resubmit_requested');
                }) ? <EmptyState text="All tests are complete. Show completed to review them." /> : null}
              </>
            )}
          </View>
        )}

        {activeTab === 'quizzes' && (
          <View style={styles.section}>
            <SectionHeading icon="trophy-outline" title="Quiz centre" />
            {activeQuizId ? (
              <QuizPanel
                quiz={quiz}
                question={currentQuestion}
                questionIndex={questionIndex}
                selectedOption={selectedOption}
                score={quizScore}
                answered={questionAnswered}
                timeLeft={timeLeft}
                finished={quizFinished}
                submitting={quizSubmitting}
                onSelect={(option) => setSelectedOption(option)}
                onCheck={() => {
                  if (selectedOption === null || !currentQuestion) return;
                  if (selectedOption === currentQuestion.correctOptionIndex) setQuizScore((current) => current + 1);
                  setQuestionAnswered(true);
                }}
                onNext={advanceQuiz}
                onClose={() => setActiveQuizId('')}
              />
            ) : quizzes.map((item) => {
              const questionsForQuiz = item.questions || [];
              const myScore = quizScores.find((entry) => entry.quizId === item.id && entry.studentId === studentId);
              const leaderboard = quizScores
                .filter((entry) => entry.quizId === item.id)
                .sort((left, right) => Number(right.score || 0) - Number(left.score || 0));
              return (
                <View key={item.id} style={styles.contentRow}>
                  <Text style={styles.itemTitle}>{item.title || 'Class quiz'}</Text>
                  <Text style={styles.metaText}>{questionsForQuiz.length} questions</Text>
                  {myScore ? <Text style={styles.statusText}>Your score: {String(myScore.score)} / {String(myScore.totalQuestions)}</Text> : (
                    <Pressable onPress={() => startQuiz(item.id)} style={styles.primaryButton}>
                      <Text style={styles.primaryButtonText}>Start quiz</Text>
                    </Pressable>
                  )}
                  <View style={styles.leaderboard}>
                    <Text style={styles.formTitle}>Batch leaderboard</Text>
                    {leaderboard.slice(0, 5).map((entry, index) => (
                      <Text key={entry.id} style={styles.metaText}>{index + 1}. {String(entry.studentName || 'Student')}  ·  {String(entry.score)} / {String(entry.totalQuestions)}</Text>
                    ))}
                    {!leaderboard.length && <Text style={styles.metaText}>No attempts yet.</Text>}
                  </View>
                </View>
              );
            })}
            {!activeQuizId && !quizzes.length && <EmptyState text="No quizzes have been published for this class." />}
          </View>
        )}

        {activeTab === 'study' && (
          <View style={styles.section}>
            <SectionHeading icon="brain" title="Self-study worksheets" />
            {activeWorksheet ? (
              <View style={styles.contentRow}>
                <Pressable onPress={() => setActiveWorksheetId('')} style={styles.inlineAction}>
                  <MaterialCommunityIcons name="arrow-left" size={17} color="#2D66C8" />
                  <Text style={styles.inlineActionText}>All worksheets</Text>
                </Pressable>
                <Text style={styles.itemTitle}>{activeWorksheet.title || 'Practice worksheet'}</Text>
                <Text style={styles.metaText}>{activeWorksheet.level || 'Practice'}  ·  {formatDate(activeWorksheet.createdAt)}</Text>
                {activeWorksheet.description ? <RichContent content={activeWorksheet.description} /> : null}
                {activeWorksheet.questionsContent ? <RichContent content={activeWorksheet.questionsContent} /> : <EmptyState text="No worksheet questions were saved." />}
                {activeWorksheet.status === 'graded' ? (
                  <View style={styles.submissionState}>
                    <Text style={styles.statusText}>AI score: {String(activeWorksheet.grade ?? 0)} / 100</Text>
                    {activeWorksheet.feedback ? <RichContent content={activeWorksheet.feedback} /> : null}
                    {activeWorksheet.studentAnswersText ? <Text style={styles.metaText}>Your response: {activeWorksheet.studentAnswersText}</Text> : null}
                  </View>
                ) : <Text style={styles.metaText}>This worksheet is ready to practice. New generation and AI grading require a secure server endpoint that is not configured for mobile.</Text>}
              </View>
            ) : worksheets.map((worksheet) => (
              <Pressable key={worksheet.id} onPress={() => setActiveWorksheetId(worksheet.id)} style={styles.contentRow}>
                <View style={styles.quizTop}>
                  <Text style={styles.itemTitle}>{worksheet.title || 'Practice worksheet'}</Text>
                  <Text style={worksheet.status === 'graded' ? styles.statusText : styles.metaText}>{worksheet.status === 'graded' ? `${worksheet.grade ?? 0}/100` : worksheet.level || 'Ready'}</Text>
                </View>
                {worksheet.description ? <RichContent content={worksheet.description} /> : null}
                <Text style={styles.metaText}>{formatDate(worksheet.createdAt)}</Text>
              </Pressable>
            ))}
            {!worksheets.length ? <EmptyState text="Worksheets generated for this class will appear here. New AI generation and grading require a secure server endpoint that is not configured for mobile." /> : null}
          </View>
        )}
      </ScrollView>
      <AttachmentViewer
        uri={activeAttachment?.uri || null}
        fileName={activeAttachment?.name}
        onClose={() => setActiveAttachment(null)}
      />
    </View>
  );
}

function SectionHeading({ icon, title }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionHeading}>
      <MaterialCommunityIcons name={icon} size={20} color="#2D66C8" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return <Text style={styles.emptyText}>{text}</Text>;
}

function QuizPanel({
  quiz,
  question,
  questionIndex,
  selectedOption,
  score,
  answered,
  timeLeft,
  finished,
  submitting,
  onSelect,
  onCheck,
  onNext,
  onClose,
}: {
  quiz?: Quiz;
  question?: QuizQuestion;
  questionIndex: number;
  selectedOption: number | null;
  score: number;
  answered: boolean;
  timeLeft: number;
  finished: boolean;
  submitting: boolean;
  onSelect: (option: number) => void;
  onCheck: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const questionCount = quiz?.questions?.length || 0;
  if (finished) {
    return (
      <View style={styles.quizResult}>
        <MaterialCommunityIcons name="trophy-outline" size={36} color="#2D66C8" />
        <Text style={styles.sectionTitle}>Quiz complete</Text>
        <Text style={styles.scoreText}>{score} / {questionCount}</Text>
        <Pressable onPress={onClose} style={styles.primaryButton}><Text style={styles.primaryButtonText}>View leaderboard</Text></Pressable>
      </View>
    );
  }
  if (!questionCount) return <EmptyState text="This quiz has no questions published yet." />;
  return (
    <View style={styles.contentRow}>
      <View style={styles.quizTop}>
        <Text style={styles.metaText}>Question {questionIndex + 1} of {questionCount}</Text>
        <Text style={styles.timer}>{answered ? 'Answer checked' : `${timeLeft}s`}</Text>
      </View>
      <RichContent content={question?.questionText} />
      {question?.options.map((option, index) => (
        <Pressable
          key={`${index}-${option}`}
          disabled={answered}
          onPress={() => onSelect(index)}
          style={[styles.option, selectedOption === index && styles.optionSelected, answered && index === question.correctOptionIndex && styles.optionCorrect]}
        >
          <RichContent content={option} />
        </Pressable>
      ))}
      {answered && <Text style={styles.metaText}>{selectedOption === question?.correctOptionIndex ? 'Correct answer!' : `Correct option: ${(question?.correctOptionIndex ?? -1) + 1}`}</Text>}
      <Pressable disabled={submitting || (!answered && selectedOption === null)} onPress={answered ? onNext : onCheck} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>{submitting ? 'Saving...' : answered ? (questionIndex === questionCount - 1 ? 'Finish quiz' : 'Next question') : 'Check answer'}</Text>
      </Pressable>
      <Pressable onPress={onClose} style={styles.quitButton}><Text style={styles.metaText}>Quit quiz</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDF8FD' },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36 },
  center: { flex: 1, backgroundColor: '#EDF8FD', alignItems: 'center', justifyContent: 'center', padding: 28 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  backText: { color: '#526579', fontSize: 13, fontWeight: '600' },
  batchHeader: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subject: { color: '#3168CC', fontSize: 10, fontWeight: '800' },
  liveBadge: { color: '#287E52', backgroundColor: '#E4F6EA', overflow: 'hidden', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, fontSize: 9, fontWeight: '800' },
  batchTitle: { color: '#25394D', fontSize: 21, fontWeight: '800', marginTop: 8 },
  batchSchedule: { color: '#8291A0', fontSize: 12, marginTop: 5 },
  meetingButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#2D66C8', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, marginTop: 14 },
  tabs: { gap: 8, paddingRight: 20, marginBottom: 14 },
  tab: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDEBF4' },
  tabActive: { backgroundColor: '#2D66C8', borderColor: '#2D66C8' },
  tabText: { color: '#718397', fontSize: 11, fontWeight: '700' },
  tabTextActive: { color: '#FFFFFF' },
  section: { gap: 11 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 3 },
  sectionTitle: { color: '#25394D', fontSize: 17, fontWeight: '800' },
  contentRow: { backgroundColor: '#FFFFFF', borderRadius: 13, padding: 15, gap: 9 },
  itemTitle: { color: '#26394D', fontSize: 15, fontWeight: '700' },
  bodyText: { color: '#5E7082', fontSize: 13, lineHeight: 19 },
  metaText: { color: '#8B99A7', fontSize: 11, lineHeight: 16 },
  inlineAction: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 5 },
  inlineActionText: { color: '#2D66C8', fontSize: 12, fontWeight: '700' },
  emptyText: { color: '#8291A0', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 18, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  formSection: { backgroundColor: '#FFFFFF', borderRadius: 13, padding: 15, gap: 10, marginTop: 4 },
  formTitle: { color: '#34495E', fontSize: 12, fontWeight: '800' },
  input: { minHeight: 42, borderRadius: 10, backgroundColor: '#F3F8FB', borderWidth: 1, borderColor: '#E0EAF1', paddingHorizontal: 12, paddingVertical: 10, color: '#27394B', fontSize: 13 },
  answerInput: { minHeight: 90, textAlignVertical: 'top' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  primaryButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#2D66C8' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  secondaryButton: { minHeight: 40, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#F3F8FB', borderWidth: 1, borderColor: '#DDE8F0' },
  secondaryButtonText: { color: '#526579', fontSize: 11, fontWeight: '700' },
  uploadArea: { gap: 9, marginTop: 8 },
  submissionState: { gap: 5, marginTop: 7, padding: 11, borderRadius: 10, backgroundColor: '#EFF8F1' },
  statusText: { color: '#287E52', fontSize: 12, fontWeight: '700' },
  warningBox: { gap: 5, backgroundColor: '#FFF7E4', borderRadius: 9, padding: 10 },
  warningTitle: { color: '#9B6B1C', fontSize: 12, fontWeight: '700' },
  leaderboard: { borderTopWidth: 1, borderTopColor: '#EAF0F4', paddingTop: 10, gap: 5, marginTop: 4 },
  quizResult: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 13, padding: 22, gap: 10 },
  scoreText: { color: '#2D66C8', fontSize: 28, fontWeight: '800' },
  quizTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timer: { color: '#B26352', fontSize: 12, fontWeight: '800' },
  option: { borderWidth: 1, borderColor: '#E0EAF1', borderRadius: 10, padding: 12 },
  optionSelected: { borderColor: '#2D66C8', backgroundColor: '#EDF5FF' },
  optionCorrect: { borderColor: '#59A878', backgroundColor: '#EFF8F1' },
  quitButton: { alignItems: 'center', padding: 8 },
  errorTitle: { color: '#34495E', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  mutedText: { color: '#8291A0', textAlign: 'center', fontSize: 13, lineHeight: 20 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 11, marginTop: 2, marginBottom: 22 },
  hubTile: { width: '48%', minHeight: 154, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E4EDF3' },
  tileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F1FF', marginBottom: 12 },
  tileTitle: { color: '#26394D', fontSize: 14, fontWeight: '800' },
  tileDescription: { color: '#8291A0', fontSize: 11, lineHeight: 15, marginTop: 4 },
  tileCount: { color: '#3971C9', fontSize: 10, fontWeight: '700', marginTop: 'auto', paddingTop: 10 },
  sectionBackRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionBackButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5 },
  sectionBackText: { color: '#2D66C8', fontSize: 12, fontWeight: '700' },
  sectionName: { color: '#536A80', fontSize: 12, fontWeight: '700' },
  filterToggle: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, paddingVertical: 5, marginBottom: 2 },
  filterToggleText: { color: '#2D66C8', fontSize: 12, fontWeight: '700' },
  titleRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: '#FFFFFF', borderRadius: 11 },
  titleRowText: { flex: 1, color: '#26394D', fontSize: 13, fontWeight: '700' },
});