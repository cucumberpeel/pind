import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

function Pin() {
    const [ mode, setMode ] = useState('upload');
    const [ file, setFile ] = useState(null);
    const [ imgUrl, setImgUrl ] = useState('');
    const [ pageUrl, setPageUrl ] = useState('');
    const [ tags, setTags ] = useState('');
    const [ fileError, setFileError ] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleToggle = () => {
        setMode(prev => (prev === 'upload' ? 'web' : 'upload'));
        setFile(null);
        setImgUrl('');
        setPageUrl('');
        setTags('');
        setFileError('');
    }

    const handleFileChange = (e) => {
        setFile(e?.target?.files[0]);
        setFileError('');
    }

    const handleImgUrlChange = (e) => {
        setImgUrl(e?.target?.value);
        setFileError('');
    }

    const handlePageUrlChange = (e) => {
        setPageUrl(e?.target?.value);
        setFileError('');
    }

    const handleTagsChange = (e) => {
        setTags(e?.target?.value);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = mode === 'upload' ? '/api/pin/upload' : '/api/pin/web';
        const data = new FormData();

        if (mode === 'upload') {
            if (!file) {
                setFileError('Please select an image to upload.');
                return;
            }
            data.append('file', file);
            data.append('tags', tags);

            await axios.post(endpoint, data, { headers: { 'Content-Type': 'multipart/form-data' }})
            .then(() => {
                setFile(null);
                setTags('');
                navigate(`/user/${user?.username}`);
            })
            .catch(err => {
                console.error(err);
                setFileError('There was an issue uploading your file. Please try again.');
            });
        }
        else {
            if (!imgUrl || !pageUrl) {
                setFileError('Please provide both image and website URLs.');
                return;
            }
            const payload = {
                img_url: imgUrl,
                page_url: pageUrl,
                tags: tags
            }
            await axios.post(endpoint, payload, { headers: { 'Content-Type': 'application/json' }})
            .then(() => {
                setImgUrl('');
                setPageUrl('');
                setTags('');
                navigate(`/user/${user?.username}`);
            })
            .catch(err => {
                console.error(err);
                setFileError('There was an issue retrieving your image. Please try again.');
            });
        }
    }

    return (
        <div id="create-pin-container">
            <h2>Create Pin</h2>
            <button type="button" onClick={handleToggle}>
                {mode === 'upload' ? 'Save from URL' : 'Upload image'}
            </button>
            { fileError && (
                <div className="error">{fileError}</div>
            )}
            <form encType="multipart/form-data" onSubmit={handleSubmit}>
                {mode === 'upload' ? (
                    <>
                    <label>Upload Image
                        <input type="file" accept="image/png, image/jpg, image/jpeg" onChange={handleFileChange} required />
                    </label>
                    </>
                ) : (
                    <>
                    <label>Image URL
                        <input type="url" name="imgUrl" value={imgUrl} onChange={handleImgUrlChange} placeholder="Enter image link" required />
                    </label>
                    <label>Website URL
                        <input type="url" name="pageUrl" value={pageUrl} onChange={handlePageUrlChange} placeholder="Enter website" required />
                    </label>
                    </>
                )}
                <label>Tags
                    <input type="text" name="tags" value={tags} onChange={handleTagsChange} placeholder="couch, brown, ikea" />
                </label>

                <button type="submit">Publish</button>
            </form>
        </div>
    )
}

export default Pin;