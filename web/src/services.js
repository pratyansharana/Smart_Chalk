import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, firebaseReady, storage } from './firebase';
import { demoAssignments, demoLeads, demoPerformance, demoSessions, demoStudents } from './data';

const memory = {
  leads: [...demoLeads],
  assignments: [...demoAssignments],
  sessions: [...demoSessions],
  students: [...demoStudents],
  performance: [...demoPerformance],
  submissions: [],
};

function sortByCreatedAt(items) {
  return [...items].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

export async function createLead(payload) {
  const lead = {
    ...payload,
    status: 'New',
    createdAt: new Date().toISOString(),
  };

  if (!firebaseReady) {
    memory.leads.unshift({ id: crypto.randomUUID(), ...lead });
    return lead;
  }

  await addDoc(collection(db, 'leads'), {
    ...payload,
    status: 'New',
    createdAt: serverTimestamp(),
  });
  return lead;
}

export async function getLeads() {
  if (!firebaseReady) return sortByCreatedAt(memory.leads);

  const snapshot = await getDocs(query(collection(db, 'leads'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function updateLeadStatus(id, status) {
  if (!firebaseReady) {
    memory.leads = memory.leads.map((lead) => (lead.id === id ? { ...lead, status } : lead));
    return;
  }

  await updateDoc(doc(db, 'leads', id), { status });
}

export async function removeLead(id) {
  if (!firebaseReady) {
    memory.leads = memory.leads.filter((lead) => lead.id !== id);
    return;
  }

  await deleteDoc(doc(db, 'leads', id));
}

export async function getStudents() {
  if (!firebaseReady) return memory.students;

  const snapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function getSessions() {
  if (!firebaseReady) return memory.sessions;

  const snapshot = await getDocs(query(collection(db, 'sessions'), orderBy('startsAt', 'asc')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function createSession(payload) {
  const session = { ...payload, createdAt: new Date().toISOString() };
  if (!firebaseReady) {
    memory.sessions.unshift({ id: crypto.randomUUID(), ...session });
    return session;
  }

  await addDoc(collection(db, 'sessions'), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return session;
}

export async function getAssignments() {
  if (!firebaseReady) return memory.assignments;

  const snapshot = await getDocs(query(collection(db, 'assignments'), orderBy('dueDate', 'asc')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function createAssignment(payload, worksheetFile) {
  let worksheetUrl = '';

  if (worksheetFile) {
    worksheetUrl = await uploadFile(`worksheets/${Date.now()}-${worksheetFile.name}`, worksheetFile);
  }

  const assignment = {
    ...payload,
    worksheetUrl,
    createdAt: new Date().toISOString(),
  };

  if (!firebaseReady) {
    memory.assignments.unshift({ id: crypto.randomUUID(), ...assignment });
    return assignment;
  }

  await addDoc(collection(db, 'assignments'), {
    ...payload,
    worksheetUrl,
    createdAt: serverTimestamp(),
  });
  return assignment;
}

export async function createSubmission({ assignmentId, studentId, file, remarks }) {
  const fileUrl = file ? await uploadFile(`submissions/${studentId}/${Date.now()}-${file.name}`, file) : '';
  const submission = {
    assignmentId,
    studentId,
    fileUrl,
    remarks,
    status: 'Submitted',
    createdAt: new Date().toISOString(),
  };

  if (!firebaseReady) {
    memory.submissions.unshift({ id: crypto.randomUUID(), ...submission });
    return submission;
  }

  await addDoc(collection(db, 'submissions'), {
    ...submission,
    createdAt: serverTimestamp(),
  });
  return submission;
}

export async function getPerformance(studentId) {
  if (!firebaseReady) return memory.performance;

  const snapshot = await getDocs(query(collection(db, 'performance'), where('studentId', '==', studentId)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function uploadFile(path, file) {
  if (!firebaseReady) {
    return URL.createObjectURL(file);
  }

  const fileRef = ref(storage, path);
  const upload = await uploadBytes(fileRef, file);
  return getDownloadURL(upload.ref);
}
