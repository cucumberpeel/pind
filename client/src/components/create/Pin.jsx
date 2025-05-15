import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

function Pin() {
    const [ mode, setMode ] = useState('upload');
    const [ file, setFile ] = useState(null);
    const [ imgSrc, setImgSrc ] = useState('');
    const [ pageSrc, setPageSrc ] = useState('');
    const [ tags, setTags ] = useState('');
    const [ fileError, setFileError ] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleToggle = () => {
        setMode(prev => (prev === 'upload' ? 'web' : 'upload'));
        setFile(null);
        setImgSrc('');
        setPageSrc('');
        setTags('');
        setFileError('');
    }

    const handleFileChange = (e) => {
        setFile(e?.target?.files[0]);
        setFileError('');
    }

    const handleImgSrcChange = (e) => {
        setImgSrc(e?.target?.value);
        setFileError('');
    }

    const handlePageSrcChange = (e) => {
        setPageSrc(e?.target?.value);
        setFileError('');
    }

    const handleTagsChange = (e) => {
        setTags(e?.target?.value);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const endpoint = mode === 'upload' ? 'http://localhost:8080/api/pin/upload' : 'http://localhost:8080/api/pin/web';
        const data = new FormData();

        if (mode === 'upload') {
            if (!file) {
                setFileError('Please select an image to upload.');
                return;
            }
            data.append('file', file);
        }
        else {
            if (!imgSrc || !pageSrc) {
                setFileError('Please provide both image and website URLs.');
                return;
            }
            data.append('img_src', imgSrc);
            data.append('page_src', pageSrc);
        }
        data.append('tags', tags);

        console.log(data.entries());
        axios.post(endpoint, data, { headers: { 'Content-Type': 'multipart/form-data' }})
        .then(() => {
            setFile(null);
            setImgSrc('');
            setPageSrc('');
            setTags('');
            navigate(`/user/${user?.username}`);
        })
        .catch(err => {
            console.error(err);
            setFileError('There was an issue creating your pin. Please try again.');
            
            // on failure, retain form values
            if (mode === 'upload') {
                setImgSrc('');
                setPageSrc('');
            }
            else {
                setFile(null);
                setTags('');
            }
        });
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
            <form onSubmit={handleSubmit}>
                {mode === 'upload' ? (
                    <>
                    <label>Upload Image
                        <input type="file" name="img" accept="image/png, image/jpg, image/jpeg" onChange={handleFileChange} required />
                    </label>
                    </>
                ) : (
                    <>
                    <label>Image URL
                        <input type="url" name="imgSrc" value={imgSrc} onChange={handleImgSrcChange} placeholder="Enter image link" required />
                    </label>
                    <label>Website URL
                        <input type="url" name="pageSrc" value={pageSrc} onChange={handlePageSrcChange} placeholder="Enter website" required />
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