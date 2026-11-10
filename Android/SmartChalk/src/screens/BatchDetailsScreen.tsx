import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  addDoc,
  collection,
  deleteDoc,
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
import { QuestionPaperContent, RichContent } from '../components/RichContent';
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
  teacherId?: string;
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
type SyllabusItem = FirestoreItem & {
  title?: string;
  description?: string;
  deadline?: string;
  completed?: boolean;
  targetGoal?: string;
  createdByName?: string;
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
  const [syllabusItems, setSyllabusItems] = useState<SyllabusItem[]>([]);
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

  // Syllabus Tracker local form state
  const [newSyllabusTitle, setNewSyllabusTitle] = useState('');
  const [newSyllabusDescription, setNewSyllabusDescription] = useState('');
  const [newSyllabusDeadline, setNewSyllabusDeadline] = useState('');
  const [newSyllabusGoal, setNewSyllabusGoal] = useState('');
  const [addingSyllabus, setAddingSyllabus] = useState(false);

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
    const unsubscribeSyllabus = watchList<SyllabusItem>('syllabus_items', 'classId', batchId, setSyllabusItems, handleError);
    const unsubscribeWorksheets = onSnapshot(
      query(
        collection(db, 'self_study_worksheets'),
        where('studentId', '==', studentId),
        where('classId', '==', batchId),
      ),
      (snapshot) => setWorksheets(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as SelfStudyWorksheet[]),
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
      unsubscribeSyllabus();
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

  // SaaS Syllabus Progress Calculation
  const totalSyllabusCount = syllabusItems.length;
  const completedSyllabusCount = syllabusItems.filter((i) => i.completed).length;
  const syllabusProgressPercent = totalSyllabusCount > 0 ? Math.round((completedSyllabusCount / totalSyllabusCount) * 100) : 0;

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

  async function addSyllabusItem() {
    if (!newSyllabusTitle.trim()) {
      Alert.alert('Title required', 'Please enter a topic or chapter title for the syllabus.');
      return;
    }
    setAddingSyllabus(true);
    try {
      await addDoc(collection(db, 'syllabus_items'), {
        classId: batchId,
        title: newSyllabusTitle.trim(),
        description: newSyllabusDescription.trim(),
        deadline: newSyllabusDeadline.trim() || 'No deadline',
        targetGoal: newSyllabusGoal.trim() || 'General Milestone',
        completed: false,
        createdBy: studentId,
        createdByName: studentName,
        createdAt: serverTimestamp(),
      });
      setNewSyllabusTitle('');
      setNewSyllabusDescription('');
      setNewSyllabusDeadline('');
      setNewSyllabusGoal('');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not add syllabus item.');
    } finally {
      setAddingSyllabus(false);
    }
  }

  async function toggleSyllabusItem(itemId: string, currentStatus: boolean) {
    try {
      await updateDoc(doc(db, 'syllabus_items', itemId), {
        completed: !currentStatus,
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not update status.');
    }
  }

  async function deleteSyllabusItem(itemId: string) {
    Alert.alert('Delete Item', 'Are you sure you want to remove this syllabus topic?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'syllabus_items', itemId));
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Could not delete item.');
          }
        },
      },
    ]);
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
        
        {/* Top Navbar Bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={16} color="#475569" />
            <Text style={styles.backText}>Classes</Text>
          </Pressable>
          {activeTab !== null && (
            <Pressable onPress={() => {
              setSelectedAssignmentId('');
              setSelectedTestId('');
              setActiveWorksheetId('');
              setActiveQuizId('');
              setActiveTab(null);
            }} style={styles.backButton}>
              <MaterialCommunityIcons name="home-outline" size={16} color="#2563EB" />
              <Text style={[styles.backText, { color: '#2563EB' }]}>Overview Hub</Text>
            </Pressable>
          )}
          {activeTab === null && (
            <View style={styles.workspacePill}>
              <View style={styles.workspaceDot} />
              <Text style={styles.workspacePillText}>Production Workspace</Text>
            </View>
          )}
        </View>

        {/* Hero SaaS Header Card & Syllabus Module (Visible ONLY when activeTab is null) */}
        {activeTab === null && (
          <>
            <View style={styles.batchHeader}>
              <View style={styles.headerTop}>
                <View style={styles.subjectBadge}>
                  <MaterialCommunityIcons name="school-outline" size={12} color="#2563EB" />
                  <Text style={styles.subject}>{batch.subject || 'ACADEMIC BATCH'}</Text>
                </View>
                {batch.status === 'live' && (
                  <View style={styles.liveBadgeWrapper}>
                    <View style={styles.liveDotPulse} />
                    <Text style={styles.liveBadge}>LIVE SESSION</Text>
                  </View>
                )}
              </View>
              <Text style={styles.batchTitle}>{batch.title || 'Class workspace'}</Text>
              <Text style={styles.batchSchedule}>{batch.schedule || 'Flexible schedule'}</Text>
              
              {!!batch.meetingLink && (
                <Pressable onPress={() => openLink(batch.meetingLink || '')} style={styles.meetingButton}>
                  <MaterialCommunityIcons name="video-wireless" size={18} color="#FFFFFF" />
                  <Text style={styles.meetingButtonText}>{batch.status === 'live' ? 'Join Live Room' : 'Open Class Portal'}</Text>
                </Pressable>
              )}
            </View>

            {/* Syllabus & Milestone Goals Manager Section (Placed immediately below Class Schedule / Open Class Portal) */}
            <View style={styles.saasSyllabusContainer}>
              <View style={styles.saasSectionHeader}>
                <View style={styles.saasTitleGroup}>
                  <View style={styles.saasHeaderIconBox}>
                    <MaterialCommunityIcons name="format-list-checks" size={18} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={styles.saasSectionTitle}>Syllabus & Milestone Goals</Text>
                    <Text style={styles.saasSectionSubtitle}>Enterprise course tracking & student objectives</Text>
                  </View>
                </View>
                <View style={styles.saasMetricBadge}>
                  <Text style={styles.saasMetricBadgeText}>{completedSyllabusCount}/{totalSyllabusCount} Done</Text>
                </View>
              </View>

              {totalSyllabusCount > 0 && (
                <View style={styles.saasProgressCard}>
                  <View style={styles.saasProgressTopRow}>
                    <Text style={styles.saasProgressLabel}>Curriculum Completion</Text>
                    <Text style={styles.saasProgressPercentText}>{syllabusProgressPercent}%</Text>
                  </View>
                  <View style={styles.saasProgressBarTrack}>
                    <View style={[styles.saasProgressBarFill, { width: `${syllabusProgressPercent}%` }]} />
                  </View>
                </View>
              )}

              <View style={styles.saasItemsList}>
                {syllabusItems.map((item) => {
                  const isCompleted = item.completed === true;
                  return (
                    <View key={item.id} style={[styles.saasCard, isCompleted && styles.saasCardCompleted]}>
                      <Pressable onPress={() => toggleSyllabusItem(item.id, isCompleted)} style={styles.saasCheckButton}>
                        <MaterialCommunityIcons 
                          name={isCompleted ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} 
                          size={22} 
                          color={isCompleted ? '#16A34A' : '#2563EB'} 
                        />
                      </Pressable>
                      <View style={styles.saasCardContent}>
                        <Text style={[styles.saasItemTitle, isCompleted && styles.saasItemTitleCompleted]}>
                          {item.title}
                        </Text>
                        {!!item.description && (
                          <Text style={styles.saasItemDesc} numberOfLines={2}>{item.description}</Text>
                        )}
                        <View style={styles.saasMetaPillsRow}>
                          <View style={styles.saasPill}>
                            <MaterialCommunityIcons name="calendar-clock" size={11} color="#D97706" />
                            <Text style={styles.saasPillText}>Due: {item.deadline || 'None'}</Text>
                          </View>
                          <View style={[styles.saasPill, styles.saasGoalPill]}>
                            <MaterialCommunityIcons name="flag-outline" size={11} color="#16A34A" />
                            <Text style={[styles.saasPillText, styles.saasGoalPillText]}>Goal: {item.targetGoal || 'Milestone'}</Text>
                          </View>
                          {!!item.createdByName && (
                            <View style={styles.saasAuthorPill}>
                              <Text style={styles.saasAuthorText}>By {item.createdByName}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Pressable onPress={() => deleteSyllabusItem(item.id)} style={styles.saasDeleteBtn}>
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#94A3B8" />
                      </Pressable>
                    </View>
                  );
                })}

                {!syllabusItems.length && (
                  <View style={styles.saasEmptyBox}>
                    <MaterialCommunityIcons name="notebook-outline" size={32} color="#CBD5E1" />
                    <Text style={styles.saasEmptyText}>No curriculum milestones tracked yet.</Text>
                    <Text style={styles.saasEmptySubtext}>Add the first chapter objective below to keep everyone aligned.</Text>
                  </View>
                )}
              </View>

              <View style={styles.saasFormContainer}>
                <View style={styles.saasFormHeader}>
                  <MaterialCommunityIcons name="plus-circle-outline" size={16} color="#2563EB" />
                  <Text style={styles.saasFormHeaderTitle}>Add Curriculum Objective / Milestone</Text>
                </View>
                
                <TextInput 
                  value={newSyllabusTitle} 
                  onChangeText={setNewSyllabusTitle} 
                  placeholder="Topic or Chapter Title (e.g. Module 4: Neural Networks)" 
                  placeholderTextColor="#94A3B8" 
                  style={styles.saasInput} 
                />
                <TextInput 
                  value={newSyllabusDescription} 
                  onChangeText={setNewSyllabusDescription} 
                  placeholder="Description or study notes (optional)" 
                  placeholderTextColor="#94A3B8" 
                  style={styles.saasInput} 
                />
                
                <View style={styles.saasRowInputs}>
                  <TextInput 
                    value={newSyllabusDeadline} 
                    onChangeText={setNewSyllabusDeadline} 
                    placeholder="Deadline (e.g. Nov 30)" 
                    placeholderTextColor="#94A3B8" 
                    style={[styles.saasInput, { flex: 1 }]} 
                  />
                  <TextInput 
                    value={newSyllabusGoal} 
                    onChangeText={setNewSyllabusGoal} 
                    placeholder="Target Goal (e.g. 10 problems)" 
                    placeholderTextColor="#94A3B8" 
                    style={[styles.saasInput, { flex: 1 }]} 
                  />
                </View>

                <Pressable 
                  disabled={addingSyllabus} 
                  onPress={addSyllabusItem} 
                  style={styles.saasSubmitButton}
                >
                  <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                  <Text style={styles.saasSubmitButtonText}>
                    {addingSyllabus ? 'Syncing Objective...' : 'Publish Objective & Milestone'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </>
        )}

        {/* Hub Navigation Tiles */}
        {activeTab === null && (
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
                  <View style={styles.tileIconContainer}>
                    <View style={styles.tileIcon}>
                      <MaterialCommunityIcons name={tab.icon} size={20} color="#2563EB" />
                    </View>
                    <View style={styles.tileBadgeCount}>
                      <Text style={styles.tileBadgeCountText}>{count}</Text>
                    </View>
                  </View>
                  <Text style={styles.tileTitle}>{tab.label}</Text>
                  <Text style={styles.tileDescription} numberOfLines={2}>{tab.description}</Text>
                  <View style={styles.tileFooterRow}>
                    <Text style={styles.tileActionLink}>Explore module</Text>
                    <MaterialCommunityIcons name="arrow-right" size={12} color="#2563EB" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Tab Content Display (When a tab like assignments, tests, or quizzes is opened, ONLY that module is shown along with the back button) */}
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
                    <MaterialCommunityIcons name="download-outline" size={17} color="#2563EB" />
                    <Text style={styles.inlineActionText}>{String(item.fileName || 'Open attachment')}</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
            {!vaultItems.length && <EmptyState text="Your teacher has not shared any resources yet." />}
            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Share a resource with the class</Text>
              <TextInput value={resourceTitle} onChangeText={setResourceTitle} placeholder="Resource title" placeholderTextColor="#94A3B8" style={styles.input} />
              <TextInput value={resourceDescription} onChangeText={setResourceDescription} placeholder="Description (optional)" placeholderTextColor="#94A3B8" style={styles.input} />
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
                <View style={styles.assignmentDetailCard}>
                    <Pressable onPress={() => setSelectedAssignmentId('')} style={styles.inlineAction}>
                      <MaterialCommunityIcons name="arrow-left" size={17} color="#2563EB" />
                      <Text style={styles.inlineActionText}>All assignments</Text>
                    </Pressable>

                    <View style={styles.assignmentDetailHeader}>
                      <View style={styles.assignmentBadge}>
                        <MaterialCommunityIcons name="file-document-outline" size={14} color="#2563EB" />
                        <Text style={styles.assignmentBadgeText}>Assignment</Text>
                      </View>
                      <Text style={styles.assignmentDueText}>Due {formatDate(assignment.dueDate)}</Text>
                    </View>

                    <Text style={styles.assignmentDetailTitle}>{String(assignment.title || 'Assignment')}</Text>
                    <View style={styles.assignmentMetaRow}>
                      <Text style={styles.assignmentMetaPill}>Max {String(assignment.maxScore || 100)}</Text>
                      <Text style={styles.assignmentMetaPill}>{submission ? 'Submitted' : 'Pending submission'}</Text>
                    </View>

                    {!!String(assignment.description || assignment.subject || '').trim() && (
                      <View style={styles.assignmentBodyWrap}>
                        <Text style={styles.assignmentContentHeading}>Goals & Guidelines</Text>
                        <RichContent content={String(assignment.description || assignment.subject || '')} />
                      </View>
                    )}

                    {!!String(assignment.assignmentContent || '').trim() && (
                      <View style={styles.assignmentBodyWrap}>
                        <Text style={styles.assignmentContentHeading}>Tasks & Questions</Text>
                        <QuestionPaperContent content={String(assignment.assignmentContent)} />
                      </View>
                    )}

                    {typeof assignment.worksheetFileURL === 'string' && assignment.worksheetFileURL ? (
                      <Pressable onPress={() => openAttachment(assignment.worksheetFileURL as string, `${String(assignment.title || 'Worksheet')}.pdf`)} style={styles.assignmentActionButton}>
                        <MaterialCommunityIcons name="download-outline" size={17} color="#2563EB" />
                        <Text style={styles.assignmentActionText}>Download worksheet</Text>
                      </Pressable>
                    ) : null}

                    {submission ? (
                      <View style={styles.submissionState}>
                        <Text style={styles.statusText}>{submission.grade === null || submission.grade === undefined ? 'Submitted for review' : `Score: ${String(submission.grade)} / ${String(assignment.maxScore || 100)}`}</Text>
                        {typeof submission.feedback === 'string' && submission.feedback ? <RichContent content={submission.feedback} /> : null}
                        {typeof submission.submittedFileURL === 'string' && submission.submittedFileURL ? (
                          <Pressable onPress={() => openAttachment(submission.submittedFileURL as string, String(submission.submittedFileName || 'Solution'))} style={styles.assignmentActionButton}>
                            <MaterialCommunityIcons name="file-eye-outline" size={17} color="#2563EB" />
                            <Text style={styles.assignmentActionText}>{String(submission.submittedFileName || 'View submitted solution')}</Text>
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
                    <MaterialCommunityIcons name={includeCompletedAssignments ? 'checkbox-marked-outline' : 'checkbox-blank-outline'} size={19} color="#2563EB" />
                    <Text style={styles.filterToggleText}>{includeCompletedAssignments ? 'Hide completed' : `Show completed (${assignments.filter((item) => assignmentSubmissionById.has(item.id)).length})`}</Text>
                  </Pressable>
                ) : null}
                {assignments.filter((item) => includeCompletedAssignments || !assignmentSubmissionById.has(item.id)).map((assignment) => {
                  const complete = assignmentSubmissionById.has(assignment.id);
                  return (
                    <Pressable key={assignment.id} onPress={() => setSelectedAssignmentId(assignment.id)} style={styles.assignmentListItem}>
                      <View style={[styles.assignmentListIconWrap, complete ? styles.iconWrapComplete : styles.iconWrapPending]}>
                        <MaterialCommunityIcons name={complete ? 'check-circle-outline' : 'file-document-outline'} size={19} color={complete ? '#16A34A' : '#2563EB'} />
                      </View>
                      <View style={styles.assignmentListBody}>
                        <Text style={styles.assignmentListTitle} numberOfLines={2}>{String(assignment.title || 'Assignment')}</Text>
                        <Text style={styles.assignmentListMeta} numberOfLines={2}>{String(assignment.description || assignment.subject || 'No description added yet.')}</Text>
                        <View style={styles.assignmentListFooter}>
                          <Text style={styles.assignmentListDue}>Due {formatDate(assignment.dueDate)}</Text>
                          <Text style={styles.assignmentListScore}>{String(assignment.maxScore || 100)} pts</Text>
                        </View>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={19} color="#94A3B8" />
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
                      <MaterialCommunityIcons name="arrow-left" size={17} color="#2563EB" />
                      <Text style={styles.inlineActionText}>All tests</Text>
                    </Pressable>
                    <Text style={styles.itemTitle}>{String(test.title || 'Class test')}</Text>
                    <RichContent content={String(test.description || '')} />
                    <Text style={styles.metaText}>Due {formatDate(test.dueDate)}  ·  Max score {String(test.maxScore || 100)}</Text>
                    {typeof test.testContent === 'string' && test.testContent ? <QuestionPaperContent content={test.testContent} /> : null}
                    {typeof test.testFileURL === 'string' && test.testFileURL ? (
                      <Pressable onPress={() => openAttachment(test.testFileURL as string, `${String(test.title || 'Test')}.pdf`)} style={styles.inlineAction}>
                        <MaterialCommunityIcons name="download-outline" size={17} color="#2563EB" />
                        <Text style={styles.inlineActionText}>Open test paper</Text>
                      </Pressable>
                    ) : null}
                    {submission && submission.status !== 'resubmit_requested' ? (
                      <View style={styles.submissionState}>
                        <Text style={styles.statusText}>{submission.status === 'graded' ? `Graded: ${String(submission.grade)} / ${String(test.maxScore || 100)}` : 'Submitted for grading'}</Text>
                        {typeof submission.feedback === 'string' && submission.feedback ? <RichContent content={submission.feedback} /> : null}
                        {typeof submission.submittedFileURL === 'string' && submission.submittedFileURL ? (
                          <Pressable onPress={() => openAttachment(submission.submittedFileURL as string, String(submission.submittedFileName || 'Solution'))} style={styles.inlineAction}>
                            <MaterialCommunityIcons name="file-eye-outline" size={17} color="#2563EB" />
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
                          placeholderTextColor="#94A3B8"
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
                    <MaterialCommunityIcons name={includeCompletedTests ? 'checkbox-marked-outline' : 'checkbox-blank-outline'} size={19} color="#2563EB" />
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
                      <MaterialCommunityIcons name={complete ? 'check-circle-outline' : 'circle-outline'} size={19} color={complete ? '#16A34A' : '#2563EB'} />
                      <Text style={styles.titleRowText} numberOfLines={2}>{String(test.title || 'Class test')}</Text>
                      <MaterialCommunityIcons name="chevron-right" size={19} color="#94A3B8" />
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
                  <MaterialCommunityIcons name="arrow-left" size={17} color="#2563EB" />
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
      <MaterialCommunityIcons name={icon} size={20} color="#2563EB" />
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
        <MaterialCommunityIcons name="trophy-outline" size={36} color="#2563EB" />
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
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 48 },
  center: { flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', padding: 28 },
  
  // Top Navbar Styles
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  backText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  workspacePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#DCFCE7', gap: 6 },
  workspaceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  workspacePillText: { fontSize: 11, fontWeight: '800', color: '#15803D', letterSpacing: 0.2 },

  // SaaS Header Card
  batchHeader: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 22, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 3 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  subjectBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, gap: 5, borderWidth: 1, borderColor: '#DBEAFE' },
  subject: { color: '#2563EB', fontSize: 10, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  liveBadgeWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, gap: 6, borderWidth: 1, borderColor: '#DCFCE7' },
  liveDotPulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  liveBadge: { color: '#15803D', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  batchTitle: { color: '#0F172A', fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  batchSchedule: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  meetingButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 12, marginTop: 16, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 2 },
  meetingButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },

  // Hub Tiles Grid
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginBottom: 24 },
  hubTile: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  tileIconContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  tileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF' },
  tileBadgeCount: { backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: '#E2E8F0' },
  tileBadgeCountText: { color: '#475569', fontSize: 11, fontWeight: '800' },
  tileTitle: { color: '#0F172A', fontSize: 14, fontWeight: '800', marginBottom: 2, letterSpacing: -0.2 },
  tileDescription: { color: '#64748B', fontSize: 11, lineHeight: 15, fontWeight: '500', marginBottom: 12 },
  tileFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 4, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 },
  tileActionLink: { color: '#2563EB', fontSize: 11, fontWeight: '700' },

  // Standard Section styling
  section: { gap: 12, marginBottom: 24 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  sectionTitle: { color: '#0F172A', fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  contentRow: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 1 },
  itemTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
  
  // Assignment & Test lists
  assignmentDetailCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, gap: 14 },
  assignmentDetailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  assignmentBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#DBEAFE' },
  assignmentBadgeText: { color: '#2563EB', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  assignmentDueText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  assignmentDetailTitle: { color: '#0F172A', fontSize: 22, fontWeight: '800', lineHeight: 28, letterSpacing: -0.3 },
  assignmentMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  assignmentMetaPill: { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 6, color: '#2563EB', fontSize: 11, fontWeight: '700' },
  assignmentBodyWrap: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  assignmentContentHeading: { color: '#0F172A', fontSize: 13, fontWeight: '800', marginBottom: 8 },
  assignmentActionButton: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: '#EFF6FF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#DBEAFE' },
  assignmentActionText: { color: '#2563EB', fontSize: 12, fontWeight: '700' },
  assignmentListItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 1 },
  assignmentListIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconWrapPending: { backgroundColor: '#EFF6FF' },
  iconWrapComplete: { backgroundColor: '#F0FDF4' },
  assignmentListBody: { flex: 1 },
  assignmentListTitle: { color: '#0F172A', fontSize: 14, fontWeight: '700', marginBottom: 3 },
  assignmentListMeta: { color: '#64748B', fontSize: 11, lineHeight: 16, fontWeight: '500' },
  assignmentListFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  assignmentListDue: { color: '#2563EB', fontSize: 11, fontWeight: '700' },
  assignmentListScore: { color: '#64748B', fontSize: 11, fontWeight: '700' },
  metaText: { color: '#64748B', fontSize: 11, lineHeight: 16, fontWeight: '500' },
  inlineAction: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  inlineActionText: { color: '#2563EB', fontSize: 12, fontWeight: '700' },
  emptyText: { color: '#64748B', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 22, fontSize: 13, lineHeight: 19, textAlign: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  formSection: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 12, marginTop: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  formTitle: { color: '#0F172A', fontSize: 13, fontWeight: '800' },
  input: { minHeight: 46, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 10, color: '#0F172A', fontSize: 13 },
  answerInput: { minHeight: 100, textAlignVertical: 'top' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  primaryButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#2563EB' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  secondaryButton: { minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  secondaryButtonText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  uploadArea: { gap: 10, marginTop: 8 },
  submissionState: { gap: 6, marginTop: 8, padding: 12, borderRadius: 12, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#DCFCE7' },
  statusText: { color: '#15803D', fontSize: 12, fontWeight: '700' },
  warningBox: { gap: 6, backgroundColor: '#FEFCE8', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FEF08A' },
  warningTitle: { color: '#A16207', fontSize: 12, fontWeight: '700' },
  leaderboard: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12, gap: 6, marginTop: 6 },
  quizResult: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, gap: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  scoreText: { color: '#2563EB', fontSize: 32, fontWeight: '800' },
  quizTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timer: { color: '#DC2626', fontSize: 12, fontWeight: '800' },
  option: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, backgroundColor: '#F8FAFC' },
  optionSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  optionCorrect: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  quitButton: { alignItems: 'center', padding: 8 },
  errorTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  mutedText: { color: '#64748B', textAlign: 'center', fontSize: 13, lineHeight: 20 },
  filterToggle: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, paddingVertical: 6, marginBottom: 4 },
  filterToggleText: { color: '#2563EB', fontSize: 12, fontWeight: '700' },
  titleRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  titleRowText: { flex: 1, color: '#0F172A', fontSize: 14, fontWeight: '700' },

  // --- SaaS Production-Grade Syllabus & Milestone Component Styles ---
  saasSyllabusContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
    gap: 16,
  },
  saasSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saasTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saasHeaderIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saasSectionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  saasSectionSubtitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  saasMetricBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  saasMetricBadgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
  },
  saasProgressCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  saasProgressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saasProgressLabel: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  saasProgressPercentText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '900',
  },
  saasProgressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  saasProgressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  saasItemsList: {
    gap: 10,
  },
  saasCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saasCardCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  saasCheckButton: {
    paddingTop: 1,
  },
  saasCardContent: {
    flex: 1,
    gap: 4,
  },
  saasItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  saasItemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  saasItemDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    fontWeight: '500',
  },
  saasMetaPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  saasPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  saasPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  saasGoalPill: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  saasGoalPillText: {
    color: '#15803D',
  },
  saasAuthorPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saasAuthorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  saasDeleteBtn: {
    padding: 4,
  },
  saasEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  saasEmptyText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },
  saasEmptySubtext: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  saasFormContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    marginTop: 4,
  },
  saasFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  saasFormHeaderTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  saasInput: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '500',
  },
  saasRowInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  saasSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    minHeight: 44,
    marginTop: 2,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  saasSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});