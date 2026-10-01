import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebaseClient';
import { AlbumData, buildNewAlbumDoc } from './firebaseInteractions';
import { Submission, SubmissionStatus } from '../types';
import { logError } from '../logger';

type NewSubmission = Omit<Submission, 'id' | 'status' | 'submitted_at' | 'published_album_id'>;

// Public — called from /submission by unauthenticated visitors. Firestore
// rules must allow `create` on `submissions` (and nothing else) for them.
async function createSubmission(submission: NewSubmission): Promise<void> {
    await addDoc(collection(db, 'submissions'), {
        ...submission,
        status: 'pending',
        submitted_at: serverTimestamp(),
    });
}

async function fetchAllSubmissions(): Promise<Submission[]> {
    const snapshot = await getDocs(collection(db, 'submissions'));
    return snapshot.docs
        .map(d => {
            const data = d.data();
            const ts = data.submitted_at as Timestamp | undefined;
            return { ...data, id: d.id, submitted_at: ts?.toMillis?.() } as Submission;
        })
        .sort((a, b) => (b.submitted_at ?? 0) - (a.submitted_at ?? 0));
}

async function updateSubmission(id: string, updates: Partial<Omit<Submission, 'id'>>): Promise<boolean> {
    try {
        await updateDoc(doc(db, 'submissions', id), updates);
        return true;
    } catch (error) {
        logError('Error updating submission:', error);
        alert('Failed to update submission: ' + error);
        return false;
    }
}

async function setSubmissionStatus(id: string, status: SubmissionStatus): Promise<boolean> {
    return updateSubmission(id, { status });
}

async function deleteSubmission(id: string): Promise<boolean> {
    try {
        await deleteDoc(doc(db, 'submissions', id));
        return true;
    } catch (error) {
        logError('Error deleting submission:', error);
        alert('Failed to delete submission: ' + error);
        return false;
    }
}

// Creates the album from the (admin-edited) submission and marks the
// submission published, linking the two so it can't be published twice.
async function publishSubmissionAsAlbum(
    submissionId: string,
    albumData: AlbumData,
    imageUrl: string,
    previewAudioUrl: string | undefined,
    hidden: boolean
): Promise<string | null> {
    try {
        const albumDoc = buildNewAlbumDoc(albumData, imageUrl, previewAudioUrl);
        if (hidden) albumDoc.hidden = true;
        const ref = await addDoc(collection(db, 'albums'), albumDoc);
        await updateDoc(doc(db, 'submissions', submissionId), { status: 'published', published_album_id: ref.id });
        return ref.id;
    } catch (error) {
        logError('Error publishing submission:', error);
        alert('Failed to publish submission: ' + error);
        return null;
    }
}

export {
    createSubmission,
    fetchAllSubmissions,
    updateSubmission,
    setSubmissionStatus,
    deleteSubmission,
    publishSubmissionAsAlbum,
};
