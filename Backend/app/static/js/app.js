// Student Module Checker - Frontend JavaScript

// File upload functionality
async function uploadStudentData() {
    const fileInput = document.getElementById('studentFile');
    const progressDiv = document.getElementById('studentUploadProgress');
    const resultDiv = document.getElementById('studentUploadResult');
    
    if (!fileInput.files[0]) {
        showAlert(resultDiv, 'Please select a file first.', 'danger');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    try {
        progressDiv.classList.remove('d-none');
        resultDiv.classList.add('d-none');
        
        const response = await fetch('/api/load-student-data', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        progressDiv.classList.add('d-none');
        
        if (response.ok) {
            showAlert(resultDiv, 
                `Upload successful!\nLoaded: ${result.loaded_rows} rows\nSkipped: ${result.skipped_rows} rows\nTime: ${result.load_time_seconds.toFixed(2)}s`, 
                'success'
            );
            
            // Close modal after 3 seconds
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('uploadStudentDataModal')).hide();
                window.location.reload(); // Refresh to update statistics
            }, 3000);
        } else {
            showAlert(resultDiv, `Upload failed: ${result.detail || 'Unknown error'}`, 'danger');
        }
    } catch (error) {
        progressDiv.classList.add('d-none');
        showAlert(resultDiv, `Upload error: ${error.message}`, 'danger');
    }
}

async function uploadModulesData() {
    const fileInput = document.getElementById('modulesFile');
    const progressDiv = document.getElementById('modulesUploadProgress');
    const resultDiv = document.getElementById('modulesUploadResult');
    
    if (!fileInput.files[0]) {
        showAlert(resultDiv, 'Please select a file first.', 'danger');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    try {
        progressDiv.classList.remove('d-none');
        resultDiv.classList.add('d-none');
        
        const response = await fetch('/api/load-allocated-modules', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        progressDiv.classList.add('d-none');
        
        if (response.ok) {
            showAlert(resultDiv, 
                `Upload successful!\nLoaded: ${result.loaded_rows} rows\nSkipped: ${result.skipped_rows} rows\nTime: ${result.load_time_seconds.toFixed(2)}s`, 
                'success'
            );
            
            // Close modal after 3 seconds
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('uploadModulesModal')).hide();
                window.location.reload(); // Refresh to update statistics
            }, 3000);
        } else {
            showAlert(resultDiv, `Upload failed: ${result.detail || 'Unknown error'}`, 'danger');
        }
    } catch (error) {
        progressDiv.classList.add('d-none');
        showAlert(resultDiv, `Upload error: ${error.message}`, 'danger');
    }
}

// Utility function to show alerts
function showAlert(container, message, type) {
    container.innerHTML = `
        <div class="alert alert-${type}" role="alert">
            ${message.replace(/\n/g, '<br>')}
        </div>
    `;
    container.classList.remove('d-none');
}

// API interaction utilities
class API {
    static async get(endpoint) {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }
    
    static async post(endpoint, data = null) {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(endpoint, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Student Module Checker - Frontend Loaded');
    
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}); 