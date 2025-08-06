// Create Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initFileUpload();
    initFormValidation();
    initPreviewUpdates();
    initBatchLabeling();
    initTrainingStatus();
});

// Global variables
let uploadedFileList = [];
let labelingStatus = {}; // Track labeling status for each file
let isTraining = false;

// File Upload Functionality
function initFileUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const uploadedFiles = document.getElementById('uploaded-files');
    const uploadCount = document.getElementById('upload-count');
    const batchControls = document.getElementById('batch-controls');
    
    const MAX_FILES = 15;

    // Click to upload
    uploadArea.addEventListener('click', () => {
        if (uploadedFileList.length >= MAX_FILES) {
            alert(`最多只能上传 ${MAX_FILES} 个视频文件`);
            return;
        }
        fileInput.click();
    });

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    });

    function handleFiles(files) {
        const remainingSlots = MAX_FILES - uploadedFileList.length;
        const filesToAdd = files.slice(0, remainingSlots);
        
        if (files.length > remainingSlots) {
            alert(`只能再上传 ${remainingSlots} 个文件，其余文件将被忽略`);
        }

        filesToAdd.forEach(file => {
            if (file.type.startsWith('video/')) {
                if (file.size <= 50 * 1024 * 1024) { // 50MB limit
                    addFileToList(file);
                } else {
                    alert(`文件 ${file.name} 太大。最大文件大小为 50MB。`);
                }
            } else {
                alert(`文件 ${file.name} 不是有效的视频文件。`);
            }
        });
        
        updateUploadCount();
        updatePreview();
        updateBatchControls();
    }

    function addFileToList(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.filename = file.name;
        
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon">🎥</div>
                <div class="file-details">
                    <h5>${file.name}</h5>
                    <p>${formatFileSize(file.size)}</p>
                </div>
            </div>
            <div class="file-actions">
                <button class="label-btn" onclick="labelSingleVideo('${file.name}')" title="AI打标">
                    <span>🤖</span>
                    <span>打标</span>
                </button>
                <button class="remove-file" onclick="removeFile('${file.name}')" title="删除">✕</button>
            </div>
            <div class="video-labeling" id="labeling-${file.name}" style="display: none;">
                <div class="labeling-header">
                    <div class="labeling-title">AI 打标结果</div>
                    <div class="labeling-actions">
                        <button class="label-btn secondary" onclick="regenerateLabel('${file.name}')">
                            <span>🔄</span>
                            <span>重新生成</span>
                        </button>
                        <button class="label-btn secondary" onclick="clearLabel('${file.name}')">
                            <span>🗑️</span>
                            <span>清除</span>
                        </button>
                    </div>
                </div>
                <div class="labeling-content">
                    <textarea class="label-textarea" id="label-text-${file.name}" placeholder="AI正在分析视频内容..."></textarea>
                    <div class="label-status">
                        <div class="status-indicator">
                            <div class="status-dot pending" id="status-dot-${file.name}"></div>
                            <span id="status-text-${file.name}">等待打标</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        uploadedFiles.appendChild(fileItem);
        uploadedFileList.push(file);
        labelingStatus[file.name] = 'pending';
    }

    function updateUploadCount() {
        const count = uploadedFileList.length;
        uploadCount.textContent = `${count}/${MAX_FILES} videos`;
        
        if (count >= MAX_FILES) {
            uploadArea.style.opacity = '0.5';
            uploadArea.style.cursor = 'not-allowed';
        } else {
            uploadArea.style.opacity = '1';
            uploadArea.style.cursor = 'pointer';
        }
    }

    function updateBatchControls() {
        if (uploadedFileList.length > 0) {
            batchControls.style.display = 'block';
        } else {
            batchControls.style.display = 'none';
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function updatePreview() {
        const previewDataset = document.getElementById('preview-dataset');
        const count = uploadedFileList.length;
        previewDataset.textContent = `${count} video${count !== 1 ? 's' : ''}`;
        validateForm();
    }
}

// Global function for removing files
window.removeFile = function(fileName) {
    const fileItem = document.querySelector(`[data-filename="${fileName}"]`);
    if (fileItem) {
        fileItem.remove();
        uploadedFileList = uploadedFileList.filter(file => file.name !== fileName);
        delete labelingStatus[fileName];
        
        updateUploadCount();
        updatePreview();
        updateBatchControls();
    }
};

// Single video labeling
window.labelSingleVideo = function(fileName) {
    const labelingDiv = document.getElementById(`labeling-${fileName}`);
    const statusDot = document.getElementById(`status-dot-${fileName}`);
    const statusText = document.getElementById(`status-text-${fileName}`);
    const textarea = document.getElementById(`label-text-${fileName}`);
    
    if (labelingDiv.style.display === 'none') {
        labelingDiv.style.display = 'block';
    }
    
    // Simulate AI labeling
    statusDot.className = 'status-dot processing';
    statusText.textContent = 'AI分析中...';
    textarea.value = '';
    textarea.placeholder = 'AI正在分析视频内容...';
    
    // Simulate API call delay
    setTimeout(() => {
        const mockLabels = [
            '一个年轻女性在户外自然光线下微笑，背景是绿色植物，适合人像摄影效果',
            '男性在工作室灯光下摆姿势，专业摄影风格，适合商业人像',
            '儿童在游乐场玩耍，充满活力的场景，适合生活摄影',
            '老年人在公园里散步，温馨的家庭场景，适合纪实摄影',
            '情侣在海边拍摄，浪漫的日落背景，适合婚纱摄影',
            '运动员在运动场上训练，动态捕捉，适合运动摄影',
            '艺术家在工作室创作，创意氛围，适合艺术摄影',
            '厨师在厨房工作，专业环境，适合美食摄影'
        ];
        
        const randomLabel = mockLabels[Math.floor(Math.random() * mockLabels.length)];
        textarea.value = randomLabel;
        textarea.placeholder = '编辑AI生成的标签...';
        
        statusDot.className = 'status-dot completed';
        statusText.textContent = '打标完成';
        labelingStatus[fileName] = 'completed';
        
        validateForm();
    }, 2000 + Math.random() * 3000); // Random delay between 2-5 seconds
};

// Regenerate label
window.regenerateLabel = function(fileName) {
    labelSingleVideo(fileName);
};

// Clear label
window.clearLabel = function(fileName) {
    const textarea = document.getElementById(`label-text-${fileName}`);
    const statusDot = document.getElementById(`status-dot-${fileName}`);
    const statusText = document.getElementById(`status-text-${fileName}`);
    
    textarea.value = '';
    textarea.placeholder = 'AI正在分析视频内容...';
    statusDot.className = 'status-dot pending';
    statusText.textContent = '等待打标';
    labelingStatus[fileName] = 'pending';
    
    validateForm();
};

// Batch Labeling
function initBatchLabeling() {
    const labelAllBtn = document.getElementById('label-all-btn');
    const clearAllLabelsBtn = document.getElementById('clear-all-labels-btn');
    
    labelAllBtn.addEventListener('click', () => {
        const pendingFiles = uploadedFileList.filter(file => 
            labelingStatus[file.name] !== 'completed'
        );
        
        if (pendingFiles.length === 0) {
            alert('所有视频都已经打标完成！');
            return;
        }
        
        labelAllBtn.disabled = true;
        labelAllBtn.innerHTML = '<span>🤖</span><span>打标中...</span>';
        
        let completedCount = 0;
        pendingFiles.forEach((file, index) => {
            setTimeout(() => {
                labelSingleVideo(file.name);
                completedCount++;
                
                if (completedCount === pendingFiles.length) {
                    labelAllBtn.disabled = false;
                    labelAllBtn.innerHTML = '<span>🤖</span><span>Label All Videos</span>';
                }
            }, index * 1000); // Stagger the labeling process
        });
    });
    
    clearAllLabelsBtn.addEventListener('click', () => {
        if (confirm('确定要清除所有视频的标签吗？')) {
            uploadedFileList.forEach(file => {
                clearLabel(file.name);
            });
        }
    });
}

// Form Validation
function initFormValidation() {
    const effectName = document.getElementById('effect-name');
    const triggerWord = document.getElementById('trigger-word');
    const submitBtn = document.getElementById('submit-btn');

    function validateForm() {
        const hasFiles = uploadedFileList.length >= 8; // Minimum 8 videos required
        const hasName = effectName.value.trim() !== '';
        const hasTrigger = triggerWord.value.trim() !== '';
        const hasLabels = Object.values(labelingStatus).some(status => status === 'completed');
        
        if (hasFiles && hasName && hasTrigger && hasLabels) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    }

    // Add event listeners for form validation
    effectName.addEventListener('input', validateForm);
    triggerWord.addEventListener('input', validateForm);
}

// Preview Updates
function initPreviewUpdates() {
    const effectName = document.getElementById('effect-name');
    const triggerWord = document.getElementById('trigger-word');
    const adapterRank = document.getElementById('adapter-rank');
    const trainingEpochs = document.getElementById('training-epochs');

    // Update preview when form fields change
    effectName.addEventListener('input', updatePreview);
    triggerWord.addEventListener('input', updatePreview);
    adapterRank.addEventListener('change', updatePreview);
    trainingEpochs.addEventListener('change', updatePreview);

    function updatePreview() {
        const previewName = document.getElementById('preview-name');
        const previewTrigger = document.getElementById('preview-trigger');
        const previewRank = document.getElementById('preview-rank');
        const previewEpochs = document.getElementById('preview-epochs');

        previewName.textContent = effectName.value.trim() || '-';
        previewTrigger.textContent = triggerWord.value.trim() || '-';
        previewRank.textContent = adapterRank.value;
        previewEpochs.textContent = trainingEpochs.value;

        // Update cost based on epochs
        updateCost();
    }

    function updateCost() {
        const epochs = parseInt(trainingEpochs.value);
        const baseCost = 300;
        const additionalCost = Math.max(0, (epochs - 30) * 5); // 5 credits per additional epoch
        const totalCost = baseCost + additionalCost;

        // Update cost display
        const costAmount = document.querySelector('.cost-amount');
        const btnCost = document.querySelector('.btn-cost');
        const additionalCostValue = document.querySelector('.cost-item:last-child .cost-value');

        costAmount.textContent = `${totalCost} credits`;
        btnCost.textContent = `${totalCost} credits`;
        additionalCostValue.textContent = `${additionalCost} credits`;

        // Update cost breakdown
        const costBreakdown = document.querySelector('.cost-breakdown');
        if (epochs > 30) {
            costBreakdown.innerHTML = `
                <div class="cost-item">
                    <span class="cost-label">Base cost:</span>
                    <span class="cost-value">300 credits</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Additional epochs:</span>
                    <span class="cost-value">${additionalCost} credits</span>
                </div>
            `;
        } else {
            costBreakdown.innerHTML = `
                <div class="cost-item">
                    <span class="cost-label">Base cost:</span>
                    <span class="cost-value">300 credits</span>
                </div>
            `;
        }
    }
}

// Training Status Management
function initTrainingStatus() {
    const submitBtn = document.getElementById('submit-btn');
    const submitSection = document.getElementById('submit-section');
    const trainingStatus = document.getElementById('training-status');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    submitBtn.addEventListener('click', function() {
        if (this.disabled || isTraining) return;

        const effectName = document.getElementById('effect-name').value;
        const triggerWord = document.getElementById('trigger-word').value;
        const adapterRank = document.getElementById('adapter-rank').value;
        const trainingEpochs = document.getElementById('training-epochs').value;
        const fileCount = uploadedFileList.length;
        const labeledCount = Object.values(labelingStatus).filter(status => status === 'completed').length;

        // Show confirmation dialog
        const confirmed = confirm(`开始训练 "${effectName}" 效果？\n\n训练配置:\n- 视频数量: ${fileCount} 个\n- 已打标: ${labeledCount} 个\n- 触发词: ${triggerWord}\n- 适配器等级: ${adapterRank}\n- 训练轮数: ${trainingEpochs}\n\n这将消耗 500 credits。`);

        if (confirmed) {
            startTraining();
        }
    });

    function startTraining() {
        isTraining = true;
        
        // Hide submit section and show training status
        submitSection.style.display = 'none';
        trainingStatus.style.display = 'block';
        
        // Simulate training progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 5; // Random progress increment
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
                
                // Training completed
                setTimeout(() => {
                    alert('训练完成！正在跳转到 My Effects 页面...');
                    window.location.href = 'my-effects.html';
                }, 1000);
            }
            
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
        }, 2000); // Update every 2 seconds
    }
}

// Utility function to validate form (called from file upload)
function validateForm() {
    const hasFiles = uploadedFileList.length >= 8;
    const hasName = document.getElementById('effect-name').value.trim() !== '';
    const hasTrigger = document.getElementById('trigger-word').value.trim() !== '';
    const hasLabels = Object.values(labelingStatus).some(status => status === 'completed');
    const submitBtn = document.getElementById('submit-btn');
    
    if (hasFiles && hasName && hasTrigger && hasLabels) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}

// Update batch controls visibility
function updateBatchControls() {
    const batchControls = document.getElementById('batch-controls');
    if (uploadedFileList.length > 0) {
        batchControls.style.display = 'block';
    } else {
        batchControls.style.display = 'none';
    }
}

// Update upload count display
function updateUploadCount() {
    const uploadCount = document.getElementById('upload-count');
    const count = uploadedFileList.length;
    uploadCount.textContent = `${count}/15 videos`;
} 