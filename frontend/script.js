const API_BASE = 'http://localhost:3000/api';

// DOM elements
const filenameInput = document.getElementById('filename');
const codeTextarea = document.getElementById('code');
const shareBtn = document.getElementById('shareBtn');
const clearBtn = document.getElementById('clearBtn');
const resultDiv = document.getElementById('result');
const shareLinkInput = document.getElementById('shareLink');
const copyBtn = document.getElementById('copyBtn');
const detectedLangSpan = document.getElementById('detectedLang');
const expiresInSpan = document.getElementById('expiresIn');
const toast = document.getElementById('toast');

// State
let isSharing = false;

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Auto-focus on code textarea
    codeTextarea.focus();
    
    // Load any saved draft
    loadDraft();
    
    // Auto-save draft as user types
    codeTextarea.addEventListener('input', debounce(saveDraft, 1000));
    filenameInput.addEventListener('input', debounce(saveDraft, 1000));
});

shareBtn.addEventListener('click', shareCode);
clearBtn.addEventListener('click', clearForm);
copyBtn.addEventListener('click', copyShareLink);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to share
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isSharing && codeTextarea.value.trim()) {
            shareCode();
        }
    }
    
    // Ctrl/Cmd + K to clear (when not focused on input)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        clearForm();
    }
});

// Functions
async function shareCode() {
    const code = codeTextarea.value.trim();
    const filename = filenameInput.value.trim();
    
    if (!code) {
        showToast('Please enter some code to share', 'error');
        codeTextarea.focus();
        return;
    }
    
    if (code.length > 1024 * 1024) {
        showToast('Code is too large (max 1MB)', 'error');
        return;
    }
    
    setLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/share`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code,
                filename: filename || undefined
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to share code');
        }
        
        const result = await response.json();
        showResult(result);
        clearDraft();
        
        // Track in analytics (if implemented)
        trackEvent('code_shared', {
            language: result.language,
            code_length: code.length
        });
        
    } catch (error) {
        console.error('Error sharing code:', error);
        showToast(error.message || 'Failed to share code. Please try again.', 'error');
    } finally {
        setLoading(false);
    }
}

function showResult(result) {
    shareLinkInput.value = result.shareUrl;
    detectedLangSpan.textContent = result.language;
    expiresInSpan.textContent = result.expiresIn;
    
    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Auto-select the share link
    shareLinkInput.select();
    
    showToast('Code shared successfully! Link copied to selection.', 'success');
}

async function copyShareLink() {
    try {
        await navigator.clipboard.writeText(shareLinkInput.value);
        showToast('Share link copied to clipboard!', 'success');
        
        // Change button text temporarily
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.disabled = true;
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        // Fallback for older browsers
        shareLinkInput.select();
        document.execCommand('copy');
        showToast('Share link copied!', 'success');
    }
}

function clearForm() {
    filenameInput.value = '';
    codeTextarea.value = '';
    resultDiv.style.display = 'none';
    clearDraft();
    codeTextarea.focus();
    showToast('Form cleared', 'success');
}

function setLoading(loading) {
    isSharing = loading;
    shareBtn.disabled = loading;
    
    const btnText = shareBtn.querySelector('.btn-text');
    const spinner = shareBtn.querySelector('.spinner');
    
    if (loading) {
        btnText.style.display = 'none';
        spinner.style.display = 'block';
    } else {
        btnText.style.display = 'block';
        spinner.style.display = 'none';
    }
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Draft functionality
function saveDraft() {
    const draft = {
        code: codeTextarea.value,
        filename: filenameInput.value,
        timestamp: Date.now()
    };
    
    try {
        localStorage.setItem('codeshare_draft', JSON.stringify(draft));
    } catch (error) {
        // localStorage might be disabled
        console.warn('Could not save draft:', error);
    }
}

function loadDraft() {
    try {
        const saved = localStorage.getItem('codeshare_draft');
        if (saved) {
            const draft = JSON.parse(saved);
            
            // Only load if draft is less than 24 hours old
            if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
                if (draft.code && draft.code.trim()) {
                    codeTextarea.value = draft.code;
                }
                if (draft.filename && draft.filename.trim()) {
                    filenameInput.value = draft.filename;
                }
                
                if (draft.code || draft.filename) {
                    showToast('Draft restored', 'success');
                }
            } else {
                clearDraft();
            }
        }
    } catch (error) {
        console.warn('Could not load draft:', error);
        clearDraft();
    }
}

function clearDraft() {
    try {
        localStorage.removeItem('codeshare_draft');
    } catch (error) {
        console.warn('Could not clear draft:', error);
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function trackEvent(eventName, properties = {}) {
    // Placeholder for analytics
    // You can integrate with Google Analytics, Mixpanel, etc.
    if (window.gtag) {
        window.gtag('event', eventName, properties);
    }
    
    console.log('Event tracked:', eventName, properties);
}

// Handle paste events for better UX
codeTextarea.addEventListener('paste', (e) => {
    // Small delay to let paste complete, then save draft
    setTimeout(saveDraft, 100);
});

// Handle drag and drop for files
const uploadSection = document.querySelector('.upload-section');

uploadSection.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadSection.classList.add('drag-over');
});

uploadSection.addEventListener('dragleave', (e) => {
    if (!uploadSection.contains(e.relatedTarget)) {
        uploadSection.classList.remove('drag-over');
    }
});

uploadSection.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadSection.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        const file = files[0];
        
        // Check file size (1MB limit)
        if (file.size > 1024 * 1024) {
            showToast('File too large (max 1MB)', 'error');
            return;
        }
        
        // Check if it's a text file
        if (!file.type.startsWith('text/') && !isCodeFile(file.name)) {
            showToast('Please drop a text or code file', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            codeTextarea.value = e.target.result;
            filenameInput.value = file.name;
            saveDraft();
            showToast(`File "${file.name}" loaded`, 'success');
        };
        reader.readAsText(file);
    }
});

function isCodeFile(filename) {
    const codeExtensions = [
        'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cs', 'cpp', 'c', 'h', 'hpp',
        'php', 'rb', 'go', 'rs', 'kt', 'swift', 'html', 'css', 'scss', 'sass',
        'json', 'xml', 'yml', 'yaml', 'sql', 'sh', 'bash', 'ps1', 'bat',
        'md', 'txt', 'log', 'conf', 'config', 'ini', 'env'
    ];
    
    const ext = filename.split('.').pop()?.toLowerCase();
    return codeExtensions.includes(ext);
}

// Add drag-over styles
const style = document.createElement('style');
style.textContent = `
    .upload-section.drag-over {
        border-color: var(--accent-primary);
        background: rgba(35, 134, 54, 0.1);
        transform: scale(1.02);
    }
`;
document.head.appendChild(style);