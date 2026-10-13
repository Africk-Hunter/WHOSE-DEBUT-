import React, { useState } from 'react';
import { updateAlbumComments } from '../../utilities/database/firebaseInteractions';
import { Album, FanComment } from '../../utilities/types';
import { optimizeCloudinaryUrl } from '../../utilities/cloudinary';

interface CommentsTabProps {
    albums: Album[];
    setAlbums: React.Dispatch<React.SetStateAction<Album[]>>;
    albumsLoading: boolean;
}

const CommentsTab: React.FC<CommentsTabProps> = ({ albums, setAlbums, albumsLoading }) => {
    const [commentsAlbumId, setCommentsAlbumId] = useState('');
    const [commentsSearch, setCommentsSearch] = useState('');
    const [newCommentName, setNewCommentName] = useState('');
    const [newCommentText, setNewCommentText] = useState('');
    const [isSavingComment, setIsSavingComment] = useState(false);

    const commentsAlbum = albums.find(a => a.id === commentsAlbumId) ?? null;
    const commentsQuery = commentsSearch.trim().toLowerCase();
    const filteredCommentsAlbums = commentsQuery
        ? albums.filter(a => a.name.toLowerCase().includes(commentsQuery) || a.artist.toLowerCase().includes(commentsQuery))
        : albums;

    const setAlbumComments = (albumId: string, comments: FanComment[]) =>
        setAlbums(prev => prev.map(a => (a.id === albumId ? { ...a, comments } : a)));

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentsAlbum) return;

        const name = newCommentName.trim();
        const text = newCommentText.trim();
        if (!name || !text) {
            alert('Enter both a name and a comment.');
            return;
        }

        const newComment: FanComment = { id: crypto.randomUUID(), name, text };
        const updatedComments = [...(commentsAlbum.comments ?? []), newComment];

        setIsSavingComment(true);
        const success = await updateAlbumComments(commentsAlbum.id, updatedComments);
        setIsSavingComment(false);

        if (success) {
            setNewCommentName('');
            setNewCommentText('');
            setAlbumComments(commentsAlbum.id, updatedComments);
        }
    };

    const handleRemoveComment = async (commentId: string) => {
        if (!commentsAlbum) return;
        const confirmed = window.confirm('Remove this comment?');
        if (!confirmed) return;

        const updatedComments = (commentsAlbum.comments ?? []).filter(c => c.id !== commentId);
        const success = await updateAlbumComments(commentsAlbum.id, updatedComments);
        if (success) {
            setAlbumComments(commentsAlbum.id, updatedComments);
        }
    };

    return (
        <section className="adminPanel">
            <h2>Fan Notes</h2>
            {albumsLoading && <p className="formHint">Loading albums&hellip;</p>}
            <div className="formGroup">
                <label htmlFor="commentsAlbumSearch">Album</label>
                <input
                    id="commentsAlbumSearch"
                    type="search"
                    placeholder="Search by album or artist&hellip;"
                    value={commentsSearch}
                    onChange={e => setCommentsSearch(e.target.value)}
                />
            </div>
            <div className="coverPicker">
                {filteredCommentsAlbums.length === 0 && !albumsLoading && (
                    <p className="formHint">No albums match.</p>
                )}
                {filteredCommentsAlbums.map(album => (
                    <button
                        key={album.id}
                        type="button"
                        className={`coverPickerItem${album.id === commentsAlbumId ? ' coverPickerItem--selected' : ''}`}
                        onClick={() => setCommentsAlbumId(album.id)}
                        title={`${album.name} · ${album.artist}`}
                    >
                        <img src={optimizeCloudinaryUrl(album.image_url, 200)} alt="" loading="lazy" />
                        <span className="coverPickerName">{album.name}</span>
                        <span className="coverPickerArtist">{album.artist}</span>
                        {(album.comments?.length ?? 0) > 0 && (
                            <span className="coverPickerBadge">{album.comments!.length}</span>
                        )}
                    </button>
                ))}
            </div>
            {commentsAlbum && (
                <h3 className="coverPickerSelected">
                    {commentsAlbum.name} &middot; {commentsAlbum.artist}
                </h3>
            )}

            {commentsAlbum && (
                <>
                    {(commentsAlbum.comments ?? []).length === 0 && (
                        <p className="formHint">No fan notes yet.</p>
                    )}
                    <ul className="commentList">
                        {(commentsAlbum.comments ?? []).map(comment => (
                            <li key={comment.id} className="commentListItem">
                                <div className="commentListInfo">
                                    <p className="commentListName">{comment.name}</p>
                                    <p className="commentListText">{comment.text}</p>
                                </div>
                                <button
                                    type="button"
                                    className="adminButton adminButton--danger"
                                    onClick={() => handleRemoveComment(comment.id)}
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>

                    <form onSubmit={handleAddComment} className="albumForm">
                        <div className="formSection">
                            <p className="formSectionTitle">Add a Fan Note</p>
                            <div className="formGroup">
                                <label htmlFor="commentName">Name</label>
                                <input
                                    type="text"
                                    id="commentName"
                                    value={newCommentName}
                                    onChange={e => setNewCommentName(e.target.value)}
                                />
                            </div>
                            <div className="formGroup">
                                <label htmlFor="commentText">Comment</label>
                                <textarea
                                    id="commentText"
                                    value={newCommentText}
                                    onChange={e => setNewCommentText(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="submitRow">
                            <button type="submit" className="adminButton adminButton--primary" disabled={isSavingComment}>
                                {isSavingComment ? 'Adding…' : 'Add Fan Note'}
                            </button>
                        </div>
                    </form>
                </>
            )}
        </section>
    );
};

export default CommentsTab;
