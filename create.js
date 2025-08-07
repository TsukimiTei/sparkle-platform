// Create Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initCreationTypeSelection();
    initFileUpload();
    initFormValidation();
    initPreviewUpdates();
    initBatchLabeling();
    initTrainingStatus();
    initPromptVideoEffect();
});

// Global variables
let uploadedFileList = [];
let labelingStatus = {}; // Track labeling status for each file
let isTraining = false;

// Prompt Video Effect variables
let selectedImages = [];
let currentPage = 1;
let imagesPerPage = 12;
let allImages = [];
let generatedVideos = [];
let selectedCoverVideo = null;
let isGenerating = false;

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

// Creation Type Selection
function initCreationTypeSelection() {
    const loraOption = document.getElementById('lora-option');
    const promptOption = document.getElementById('prompt-option');
    const loraForm = document.getElementById('lora-form');
    const promptForm = document.getElementById('prompt-form');

    loraOption.addEventListener('click', () => {
        loraOption.classList.add('active');
        promptOption.classList.remove('active');
        loraForm.style.display = 'block';
        promptForm.style.display = 'none';
        
        // 折叠两个选项
        collapseOptions();
    });

    promptOption.addEventListener('click', () => {
        promptOption.classList.add('active');
        loraOption.classList.remove('active');
        promptForm.style.display = 'block';
        loraForm.style.display = 'none';
        loadImageGallery();
        
        // 折叠两个选项
        collapseOptions();
    });
}

// 折叠选项函数
function collapseOptions() {
    const loraOption = document.getElementById('lora-option');
    const promptOption = document.getElementById('prompt-option');
    
    // 添加折叠类
    loraOption.classList.add('collapsed');
    promptOption.classList.add('collapsed');
    
    // 调整容器样式
    const typeSelector = document.querySelector('.type-selector');
    if (typeSelector) {
        typeSelector.style.maxWidth = '600px';
        typeSelector.style.gap = '1rem';
    }
    
    // 显示More Info按钮
    const typeReset = document.getElementById('type-reset');
    if (typeReset) {
        typeReset.style.display = 'block';
        setTimeout(() => {
            typeReset.classList.add('show');
        }, 100);
    }
}

// 展开选项函数（点击More Info后展开）
function expandOptions() {
    const loraOption = document.getElementById('lora-option');
    const promptOption = document.getElementById('prompt-option');
    
    // 移除折叠类，恢复到初始展开状态
    loraOption.classList.remove('collapsed');
    promptOption.classList.remove('collapsed');
    
    // 恢复容器样式
    const typeSelector = document.querySelector('.type-selector');
    if (typeSelector) {
        typeSelector.style.maxWidth = '800px';
        typeSelector.style.gap = '1.5rem';
    }
    
    // 隐藏More Info按钮
    const typeReset = document.getElementById('type-reset');
    if (typeReset) {
        typeReset.classList.remove('show');
        setTimeout(() => {
            typeReset.style.display = 'none';
        }, 300);
    }
}

// Prompt Video Effect Functionality
function initPromptVideoEffect() {
    initImageGallery();
    initPromptValidation();
    initVideoGeneration();
    initPublishEffect();
}

function initImageGallery() {
    // Generate mock images for demonstration
    generateMockImages();
    
    const searchInput = document.getElementById('image-search');
    const filterSelect = document.getElementById('image-filter');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    searchInput.addEventListener('input', filterImages);
    filterSelect.addEventListener('change', filterImages);
    prevBtn.addEventListener('click', () => changePage(-1));
    nextBtn.addEventListener('click', () => changePage(1));
}

function generateMockImages() {
    const categories = ['portrait', 'landscape', 'action', 'artistic'];
    const mockImages = [];
    
    for (let i = 1; i <= 120; i++) {
        mockImages.push({
            id: i,
            url: `https://picsum.photos/300/300?random=${i}`,
            category: categories[Math.floor(Math.random() * categories.length)],
            name: `Model Image ${i}`,
            tags: ['model', 'professional', 'high-quality']
        });
    }
    
    allImages = mockImages;
    loadImageGallery();
}

function loadImageGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    const startIndex = (currentPage - 1) * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    const pageImages = allImages.slice(startIndex, endIndex);
    
    galleryGrid.innerHTML = '';
    
    pageImages.forEach(image => {
        const imageItem = document.createElement('div');
        imageItem.className = 'gallery-item';
        imageItem.dataset.imageId = image.id;
        
        const isSelected = selectedImages.some(img => img.id === image.id);
        
        imageItem.innerHTML = `
            <img src="${image.url}" alt="${image.name}" loading="lazy">
            ${isSelected ? '<div class="select-overlay">✓</div>' : ''}
        `;
        
        imageItem.addEventListener('click', () => toggleImageSelection(image));
        galleryGrid.appendChild(imageItem);
    });
    
    updatePagination();
    updateSelectedCount();
}

function toggleImageSelection(image) {
    const imageItem = document.querySelector(`[data-image-id="${image.id}"]`);
    const isSelected = selectedImages.some(img => img.id === image.id);
    
    if (isSelected) {
        selectedImages = selectedImages.filter(img => img.id !== image.id);
        imageItem.classList.remove('selected');
        imageItem.querySelector('.select-overlay')?.remove();
    } else {
        if (selectedImages.length >= 5) {
            alert('最多只能选择5张图片');
            return;
        }
        selectedImages.push(image);
        imageItem.classList.add('selected');
        imageItem.innerHTML += '<div class="select-overlay">✓</div>';
    }
    
    updateSelectedCount();
    updateSelectedImagesPreview();
    validatePromptForm();
}

function updateSelectedCount() {
    const selectedCount = document.getElementById('selected-count');
    selectedCount.textContent = `${selectedImages.length}/5 images`;
}

function updateSelectedImagesPreview() {
    const selectedImagesDiv = document.getElementById('selected-images');
    const selectedGrid = document.getElementById('selected-grid');
    
    if (selectedImages.length > 0) {
        selectedImagesDiv.style.display = 'block';
        selectedGrid.innerHTML = '';
        
        selectedImages.forEach(image => {
            const item = document.createElement('div');
            item.className = 'selected-item';
            item.innerHTML = `
                <img src="${image.url}" alt="${image.name}">
                <button class="remove-btn" onclick="removeSelectedImage(${image.id})">✕</button>
            `;
            selectedGrid.appendChild(item);
        });
    } else {
        selectedImagesDiv.style.display = 'none';
    }
}

function removeSelectedImage(imageId) {
    selectedImages = selectedImages.filter(img => img.id !== imageId);
    updateSelectedCount();
    updateSelectedImagesPreview();
    loadImageGallery(); // Refresh gallery to update selection state
    validatePromptForm();
}

// Global function for removing selected images
window.removeSelectedImage = removeSelectedImage;

function filterImages() {
    const searchTerm = document.getElementById('image-search').value.toLowerCase();
    const filterValue = document.getElementById('image-filter').value;
    
    const filteredImages = allImages.filter(image => {
        const matchesSearch = image.name.toLowerCase().includes(searchTerm) || 
                            image.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        const matchesFilter = filterValue === 'all' || image.category === filterValue;
        
        return matchesSearch && matchesFilter;
    });
    
    // Update displayed images
    const galleryGrid = document.getElementById('gallery-grid');
    galleryGrid.innerHTML = '';
    
    filteredImages.slice(0, imagesPerPage).forEach(image => {
        const imageItem = document.createElement('div');
        imageItem.className = 'gallery-item';
        imageItem.dataset.imageId = image.id;
        
        const isSelected = selectedImages.some(img => img.id === image.id);
        
        imageItem.innerHTML = `
            <img src="${image.url}" alt="${image.name}" loading="lazy">
            ${isSelected ? '<div class="select-overlay">✓</div>' : ''}
        `;
        
        imageItem.addEventListener('click', () => toggleImageSelection(image));
        galleryGrid.appendChild(imageItem);
    });
}

function changePage(direction) {
    const totalPages = Math.ceil(allImages.length / imagesPerPage);
    currentPage = Math.max(1, Math.min(totalPages, currentPage + direction));
    loadImageGallery();
}

function updatePagination() {
    const totalPages = Math.ceil(allImages.length / imagesPerPage);
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

// Prompt Validation
function initPromptValidation() {
    const promptText = document.getElementById('prompt-text');
    const generateBtn = document.getElementById('generate-btn');
    
    promptText.addEventListener('input', validatePromptForm);
}

function validatePromptForm() {
    const promptText = document.getElementById('prompt-text');
    const generateBtn = document.getElementById('generate-btn');
    
    const hasImages = selectedImages.length >= 3 && selectedImages.length <= 5;
    const hasPrompt = promptText.value.trim().length > 0;
    
    generateBtn.disabled = !hasImages || !hasPrompt || isGenerating;
}

// Video Generation
function initVideoGeneration() {
    const generateBtn = document.getElementById('generate-btn');
    generateBtn.addEventListener('click', generateVideos);
}

function generateVideos() {
    if (isGenerating) return;
    
    isGenerating = true;
    const generateBtn = document.getElementById('generate-btn');
    const generationProgress = document.getElementById('generation-progress');
    const progressFill = document.getElementById('prompt-progress-fill');
    const progressText = document.getElementById('prompt-progress-text');
    const progressStatus = document.getElementById('progress-status');
    
    generateBtn.disabled = true;
    generationProgress.style.display = 'block';
    
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
            
            setTimeout(() => {
                generationProgress.style.display = 'none';
                generateVideosFromImages();
                isGenerating = false;
                generateBtn.disabled = false;
            }, 500);
        }
        
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;
        
        if (progress < 30) {
            progressStatus.textContent = 'Analyzing images...';
        } else if (progress < 60) {
            progressStatus.textContent = 'Generating videos...';
        } else if (progress < 90) {
            progressStatus.textContent = 'Processing effects...';
        } else {
            progressStatus.textContent = 'Finalizing...';
        }
    }, 200);
}

function generateVideosFromImages() {
    const promptText = document.getElementById('prompt-text').value;
    const duration = document.getElementById('video-duration').value;
    const styleStrength = document.getElementById('style-strength').value;
    
    generatedVideos = [];
    
    // Generate mock videos for each selected image
    selectedImages.forEach((image, index) => {
        const videoId = `video-${Date.now()}-${index}`;
        const mockVideoUrl = `https://sample-videos.com/zip/10/mp4/SampleVideo_${(index % 5) + 1}_1280x720_1mb.mp4`;
        
        generatedVideos.push({
            id: videoId,
            imageId: image.id,
            imageUrl: image.url,
            videoUrl: mockVideoUrl,
            prompt: promptText,
            duration: duration,
            styleStrength: styleStrength
        });
    });
    
    displayGeneratedVideos();
}

function displayGeneratedVideos() {
    const generatedVideosDiv = document.getElementById('generated-videos');
    const videosGrid = document.getElementById('videos-grid');
    
    generatedVideosDiv.style.display = 'block';
    videosGrid.innerHTML = '';
    
    generatedVideos.forEach(video => {
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.dataset.videoId = video.id;
        
        videoItem.innerHTML = `
            <video src="${video.videoUrl}" controls>
                Your browser does not support the video tag.
            </video>
        `;
        
        videoItem.addEventListener('click', () => selectCoverVideo(video));
        videosGrid.appendChild(videoItem);
    });
}

function selectCoverVideo(video) {
    selectedCoverVideo = video;
    
    // Update UI to show selection
    document.querySelectorAll('.video-item').forEach(item => {
        item.classList.remove('selected');
        item.querySelector('.select-overlay')?.remove();
    });
    
    const selectedItem = document.querySelector(`[data-video-id="${video.id}"]`);
    selectedItem.classList.add('selected');
    selectedItem.innerHTML += '<div class="select-overlay">✓</div>';
    
    // Update preview
    updatePublishPreview();
    validatePublishForm();
}

// Publish Effect
function initPublishEffect() {
    const effectName = document.getElementById('prompt-effect-name');
    const effectDescription = document.getElementById('effect-description');
    const effectTags = document.getElementById('effect-tags');
    const publishBtn = document.getElementById('publish-btn');
    
    effectName.addEventListener('input', () => {
        validatePublishForm();
        updatePublishPreview();
    });
    effectDescription.addEventListener('input', () => {
        validatePublishForm();
        updatePublishPreview();
    });
    effectTags.addEventListener('input', () => {
        validatePublishForm();
        updatePublishPreview();
    });
    
    publishBtn.addEventListener('click', publishEffect);
}

function validatePublishForm() {
    const effectName = document.getElementById('prompt-effect-name');
    const effectDescription = document.getElementById('effect-description');
    const effectTags = document.getElementById('effect-tags');
    const publishBtn = document.getElementById('publish-btn');
    
    const hasName = effectName.value.trim().length > 0;
    const hasDescription = effectDescription.value.trim().length > 0;
    const hasTags = effectTags.value.trim().length > 0;
    const hasCoverVideo = selectedCoverVideo !== null;
    
    publishBtn.disabled = !hasName || !hasDescription || !hasTags || !hasCoverVideo;
}

function updatePublishPreview() {
    const effectName = document.getElementById('prompt-effect-name');
    const effectDescription = document.getElementById('effect-description');
    const effectTags = document.getElementById('effect-tags');
    
    const previewName = document.getElementById('preview-name');
    const previewDescription = document.getElementById('preview-description');
    const previewTags = document.getElementById('preview-tags');
    const previewVideo = document.getElementById('preview-video');
    
    previewName.textContent = effectName.value.trim() || 'Effect Name';
    previewDescription.textContent = effectDescription.value.trim() || 'Effect description will appear here';
    
    // Update tags
    const tags = effectTags.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    previewTags.innerHTML = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    
    // Update video preview
    if (selectedCoverVideo) {
        previewVideo.innerHTML = `
            <video src="${selectedCoverVideo.videoUrl}" controls style="width: 100%; height: 100%; object-fit: cover;">
                Your browser does not support the video tag.
            </video>
        `;
    }
}

function publishEffect() {
    const effectName = document.getElementById('prompt-effect-name').value;
    const effectCategory = document.getElementById('effect-category').value;
    const effectDescription = document.getElementById('effect-description').value;
    const effectTags = document.getElementById('effect-tags').value;
    
    if (!selectedCoverVideo) {
        alert('请选择一个封面视频');
        return;
    }
    
    // Create effect object
    const promptEffect = {
        id: `prompt-${Date.now()}`,
        name: effectName,
        category: effectCategory,
        description: effectDescription,
        tags: effectTags.split(',').map(tag => tag.trim()),
        coverVideo: selectedCoverVideo,
        selectedImages: selectedImages,
        prompt: document.getElementById('prompt-text').value,
        createdAt: new Date().toISOString(),
        status: 'published'
    };
    
    // Save to localStorage (in a real app, this would be sent to server)
    const existingEffects = JSON.parse(localStorage.getItem('promptEffects') || '[]');
    existingEffects.push(promptEffect);
    localStorage.setItem('promptEffects', JSON.stringify(existingEffects));
    
    // Show success message and redirect
    alert('Prompt Effect 发布成功！正在跳转到 My Effects 页面...');
    window.location.href = 'my-effects.html';
} 