import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseconfig';

export interface StudentClass {
  id: string;
  title?: string;
  subject?: string;
  schedule?: string;
  status?: string;
  meetingLink?: string;
  studentIds?: string[];
  pendingStudentIds?: string[];
  notes?: { id: string; text: string; createdAt?: string }[];
}

export interface StudentAssignment {
  id: string;
  classId?: string;
  title: string;
  description?: string;
  subject?: string;
  dueDate?: { toDate?: () => Date } | string | Date;
  maxScore?: number;
  worksheetFileURL?: string;
}

export interface StudentSubmission {
  id: string;
  assignmentId?: string;
  testId?: string;
  studentId: string;
  grade?: number | null;
  maxScore?: number;
  feedback?: string;
  status?: string;
  submittedAt?: StudentAssignment['dueDate'];
  submittedFileURL?: string;
  submittedFileName?: string;
}

interface LiveList<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  ownerId?: string;
}

function toDate(value: StudentAssignment['dueDate']) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function useStudentDashboard(studentId?: string) {
  const [classes, setClasses] = useState<LiveList<StudentClass>>({ data: [], loading: Boolean(studentId), error: null });
  const [pendingClasses, setPendingClasses] = useState<LiveList<StudentClass>>({ data: [], loading: Boolean(studentId), error: null });
  const [assignments, setAssignments] = useState<LiveList<StudentAssignment>>({ data: [], loading: Boolean(studentId), error: null });
  const [submissions, setSubmissions] = useState<LiveList<StudentSubmission>>({ data: [], loading: Boolean(studentId), error: null });

  useEffect(() => {
    if (!studentId || !db) return undefined;

    return onSnapshot(
      query(collection(db, 'classes'), where('studentIds', 'array-contains', studentId)),
      (snapshot) => {
        const data = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }) as StudentClass)
          .sort((left, right) => left.title?.localeCompare(right.title || '') || 0);
        setClasses({ data, loading: false, error: null, ownerId: studentId });
      },
      (error) => setClasses({ data: [], loading: false, error, ownerId: studentId }),
    );
  }, [studentId]);

  useEffect(() => {
    if (!studentId || !db) return undefined;

    return onSnapshot(
      query(collection(db, 'classes'), where('pendingStudentIds', 'array-contains', studentId)),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as StudentClass);
        setPendingClasses({ data, loading: false, error: null, ownerId: studentId });
      },
      (error) => setPendingClasses({ data: [], loading: false, error, ownerId: studentId }),
    );
  }, [studentId]);

  useEffect(() => {
    if (!studentId || !db) return undefined;

    return onSnapshot(
      query(collection(db, 'assignments'), where('assignedStudentIds', 'array-contains', studentId)),
      (snapshot) => {
        const data = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }) as StudentAssignment)
          .sort((left, right) => (toDate(left.dueDate)?.getTime() || 0) - (toDate(right.dueDate)?.getTime() || 0));
        setAssignments({ data, loading: false, error: null, ownerId: studentId });
      },
      (error) => setAssignments({ data: [], loading: false, error, ownerId: studentId }),
    );
  }, [studentId]);

  useEffect(() => {
    if (!studentId || !db) return undefined;

    return onSnapshot(
      query(collection(db, 'submissions'), where('studentId', '==', studentId)),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as StudentSubmission);
        setSubmissions({ data, loading: false, error: null, ownerId: studentId });
      },
      (error) => setSubmissions({ data: [], loading: false, error, ownerId: studentId }),
    );
  }, [studentId]);

  const forCurrentStudent = <T,>(state: LiveList<T>) => state.ownerId === studentId
    ? state
    : { data: [], loading: Boolean(studentId), error: null };

  return {
    classes: forCurrentStudent(classes),
    pendingClasses: forCurrentStudent(pendingClasses),
    assignments: forCurrentStudent(assignments),
    submissions: forCurrentStudent(submissions),
  };
}

export function getAssignmentDueDate(assignment: StudentAssignment) {
  return toDate(assignment.dueDate);
}