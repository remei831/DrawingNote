document.addEventListener('DOMContentLoaded', function() {
    // 定義主要元素
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');
    const preview = document.getElementById('preview');
    const tagInput = document.getElementById('tagInput');
    const addTagBtn = document.getElementById('addTagBtn');
    const currentTags = document.getElementById('currentTags');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const clearNoteBtn = document.getElementById('clearNoteBtn');
    const savedNotes = document.getElementById('savedNotes');
    const tagFilters = document.getElementById('tagFilters');
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const exportJSONBtn = document.getElementById('exportJSONBtn');
    const exportMarkdownBtn = document.getElementById('exportMarkdownBtn');

    // 畫布相關
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const colorPicker = document.getElementById('colorPicker');
    const brushSize = document.getElementById('brushSize');
    const clearCanvasBtn = document.getElementById('clearCanvasBtn');

    // 初始化畫布尺寸
    canvas.width = canvas.parentElement.clientWidth - 20;
    canvas.height = 300;
    
    // 當前筆記的標籤
    let currentNoteTags = [];

    // =====================
    // 初始化
    // =====================
    
    // 頁面載入時顯示已保存的筆記
    displaySavedNotes();
    updateTagFilters();
    
    // Markdown 即時預覽
    noteContent.addEventListener('input', function() {
        preview.innerHTML = marked.parse(this.value);
    });

    // =====================
    // 標籤相關功能
    // =====================
    
    // 新增標籤
    addTagBtn.addEventListener('click', function() {
        addTags();
    });
    
    // 按 Enter 鍵也可新增標籤
    tagInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTags();
        }
    });
    
    function addTags() {
        const tagsText = tagInput.value.trim();
        if (!tagsText) return;
        
        // 提取所有標籤（以#開頭的單字）
        const tags = tagsText.split(/\s+/).filter(tag => tag.startsWith('#'));
        
        if (tags.length === 0) {
            alert('請使用 # 開頭標記標籤（例如：#風景 #素描）');
            return;
        }
        
        // 添加到當前標籤集合中（避免重複）
        tags.forEach(tag => {
            if (!currentNoteTags.includes(tag)) {
                currentNoteTags.push(tag);
                
                // 創建標籤元素
                const tagElement = document.createElement('span');
                tagElement.classList.add('tag');
                tagElement.textContent = tag;
                
                // 添加刪除按鈕
                const deleteBtn = document.createElement('span');
                deleteBtn.classList.add('delete-tag');
                deleteBtn.textContent = '×';
                deleteBtn.addEventListener('click', function() {
                    currentNoteTags = currentNoteTags.filter(t => t !== tag);
                    tagElement.remove();
                });
                
                tagElement.appendChild(deleteBtn);
                currentTags.appendChild(tagElement);
            }
        });
        
        // 清空輸入框
        tagInput.value = '';
    }
    
    // =====================
    // 畫布功能
    // =====================
    
    let isDrawing = false;
    
    // 滑鼠繪圖事件
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // 觸控設備繪圖事件
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    function startDrawing(e) {
        isDrawing = true;
        draw(e);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        // 取得滑鼠或觸控位置
        let x, y;
        if (e.type.includes('touch')) {
            const rect = canvas.getBoundingClientRect();
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
            e.preventDefault(); // 避免滾動
        } else {
            x = e.offsetX;
            y = e.offsetY;
        }
        
        ctx.lineWidth = brushSize.value;
        ctx.lineCap = 'round';
        ctx.strokeStyle = colorPicker.value;
        
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    
    function stopDrawing() {
        isDrawing = false;
        ctx.beginPath();
    }
    
    function handleTouch(e) {
        if (e.type === 'touchstart') {
            startDrawing(e);
        } else if (e.type === 'touchmove') {
            draw(e);
        }
    }
    
    // 清除畫布
    clearCanvasBtn.addEventListener('click', function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    
    // =====================
    // 圖片上傳
    // =====================
    
    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = document.createElement('img');
            img.src = event.target.result;
            img.style.maxWidth = '100%';
            
            // 清空預覽區並添加新圖片
            imagePreview.innerHTML = '';
            imagePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
    
    // =====================
    // 筆記管理
    // =====================
    
    // 儲存筆記
    saveNoteBtn.addEventListener('click', function() {
        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();
        
        if (!title || !content) {
            alert('⚠️ 請輸入標題與內容！');
            return;
        }
        
        // 獲取畫布數據
        const canvasData = canvas.toDataURL();
        
        // 獲取上傳的圖片數據
        const imageData = imagePreview.querySelector('img')?.src || '';
        
        // 取得現有筆記或初始化新陣列
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        
        // 添加新筆記
        const newNote = {
            id: Date.now(), // 使用時間戳作為唯一ID
            title,
            content,
            tags: [...currentNoteTags],
            canvasData: canvasData,
            imageData: imageData,
            createdAt: new Date().toISOString()
        };
        
        notes.push(newNote);
        localStorage.setItem('notes', JSON.stringify(notes));
        
        // 更新顯示
        displaySavedNotes();
        updateTagFilters();
        
        // 清除表單
        clearNoteForm();
        
        alert('✅ 筆記已儲存！');
    });
    
    // 清除當前編輯的筆記
    clearNoteBtn.addEventListener('click', clearNoteForm);
    
    function clearNoteForm() {
        noteTitle.value = '';
        noteContent.value = '';
        preview.innerHTML = '';
        currentTags.innerHTML = '';
        currentNoteTags = [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        imagePreview.innerHTML = '';
        imageUpload.value = '';
    }
    
    // 顯示保存的筆記
    function displaySavedNotes(filterTag = null) {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        savedNotes.innerHTML = '';
        
        // 如果沒有筆記，顯示提示
        if (notes.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.classList.add('empty-notes');
            emptyMsg.textContent = '尚未儲存任何筆記';
            savedNotes.appendChild(emptyMsg);
            return;
        }
        
        // 依照日期排序（新的在前）
        notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        notes.forEach((note, index) => {
            // 如果有過濾標籤且筆記不包含該標籤，則跳過
            if (filterTag && !note.tags.includes(filterTag)) {
                return;
            }
            
            const noteCard = document.createElement('div');
            noteCard.classList.add('note-card');
            noteCard.dataset.id = note.id;
            
            // 筆記標題
            const titleEl = document.createElement('h3');
            titleEl.textContent = note.title;
            noteCard.appendChild(titleEl);
            
            // 筆記標籤
            if (note.tags && note.tags.length > 0) {
                const tagsContainer = document.createElement('div');
                tagsContainer.classList.add('note-tags');
                
                note.tags.forEach(tag => {
                    const tagEl = document.createElement('span');
                    tagEl.classList.add('tag');
                    tagEl.textContent = tag;
                    tagEl.addEventListener('click', function() {
                        displaySavedNotes(tag);
                        highlightActiveFilter(tag);
                    });
                    tagsContainer.appendChild(tagEl);
                });
                
                noteCard.appendChild(tagsContainer);
            }
            
            // 筆記內容（Markdown 解析）
            const contentEl = document.createElement('div');
            contentEl.classList.add('note-content');
            contentEl.innerHTML = marked.parse(note.content);
            noteCard.appendChild(contentEl);
            
            // 筆記圖片（如果有）
            if (note.canvasData && note.canvasData !== canvas.toDataURL('image/png', 0)) {
                const canvasImg = document.createElement('img');
                canvasImg.src = note.canvasData;
                canvasImg.classList.add('note-image');
                noteCard.appendChild(canvasImg);
            }
            
            if (note.imageData) {
                const uploadedImg = document.createElement('img');
                uploadedImg.src = note.imageData;
                uploadedImg.classList.add('note-image');
                noteCard.appendChild(uploadedImg);
            }
            
            // 按鈕容器
            const btnContainer = document.createElement('div');
            btnContainer.classList.add('note-buttons');
            
            // 編輯按鈕
            const editBtn = document.createElement('button');
            editBtn.classList.add('edit-btn');
            editBtn.textContent = '✏️ 編輯';
            editBtn.addEventListener('click', function() {
                editNote(note);
            });
            btnContainer.appendChild(editBtn);
            
            // 刪除按鈕
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.textContent = '🗑️ 刪除';
            deleteBtn.addEventListener('click', function() {
                if (confirm('確定要刪除這個筆記嗎？')) {
                    deleteNote(index);
                }
            });
            btnContainer.appendChild(deleteBtn);
            
            noteCard.appendChild(btnContainer);
            savedNotes.appendChild(noteCard);
        });
    }
    
    // 編輯筆記
    function editNote(note) {
        // 填入表單
        noteTitle.value = note.title;
        noteContent.value = note.content;
        preview.innerHTML = marked.parse(note.content);
        
        // 清空當前標籤並添加筆記標籤
        currentTags.innerHTML = '';
        currentNoteTags = [...note.tags];
        
        currentNoteTags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.classList.add('tag');
            tagElement.textContent = tag;
            
            const deleteBtn = document.createElement('span');
            deleteBtn.classList.add('delete-tag');
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', function() {
                currentNoteTags = currentNoteTags.filter(t => t !== tag);
                tagElement.remove();
            });
            
            tagElement.appendChild(deleteBtn);
            currentTags.appendChild(tagElement);
        });
        
        // 若有畫布數據，恢復畫布
        if (note.canvasData) {
            const img = new Image();
            img.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = note.canvasData;
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        // 若有上傳圖片，恢復預覽
        if (note.imageData) {
            imagePreview.innerHTML = '';
            const img = document.createElement('img');
            img.src = note.imageData;
            img.style.maxWidth = '100%';
            imagePreview.appendChild(img);
        } else {
            imagePreview.innerHTML = '';
        }
        
        // 刪除舊筆記
        deleteNote(findNoteIndex(note.id));
        
        // 滾動到頁面頂部
        window.scrollTo(0, 0);
    }
    
    // 刪除筆記
    function deleteNote(index) {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        notes.splice(index, 1);
        localStorage.setItem('notes', JSON.stringify(notes));
        displaySavedNotes();
        updateTagFilters();
    }
    
    // 尋找筆記索引
    function findNoteIndex(id) {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        return notes.findIndex(note => note.id === id);
    }
    
    // =====================
    // 標籤過濾系統
    // =====================
    
    function updateTagFilters() {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        const uniqueTags = new Set();
        
        // 收集所有唯一標籤
        notes.forEach(note => {
            (note.tags || []).forEach(tag => uniqueTags.add(tag));
        });
        
        // 清空並重建標籤過濾器
        tagFilters.innerHTML = '';
        
        // 添加「全部」選項
        const allTag = document.createElement('span');
        allTag.classList.add('tag', 'filter-tag', 'active');
        allTag.textContent = '全部';
        allTag.addEventListener('click', function() {
            displaySavedNotes();
            highlightActiveFilter();
        });
        tagFilters.appendChild(allTag);
        
        // 添加每個唯一標籤
        Array.from(uniqueTags).sort().forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.classList.add('tag', 'filter-tag');
            tagEl.textContent = tag;
            tagEl.addEventListener('click', function() {
                displaySavedNotes(tag);
                highlightActiveFilter(tag);
            });
            tagFilters.appendChild(tagEl);
        });
    }
    
    function highlightActiveFilter(activeTag = null) {
        // 移除所有標籤的「active」類
        document.querySelectorAll('.filter-tag').forEach(tag => {
            tag.classList.remove('active');
        });
        
        // 若沒有指定標籤，激活「全部」
        if (!activeTag) {
            document.querySelector('.filter-tag').classList.add('active');
        } else {
            // 否則激活匹配的標籤
            document.querySelectorAll('.filter-tag').forEach(tag => {
                if (tag.textContent === activeTag) {
                    tag.classList.add('active');
                }
            });
        }
    }
    
    // =====================
    // 匯出功能
    // =====================
    
    // 匯出 JSON
    exportJSONBtn.addEventListener('click', function() {
        const notes = localStorage.getItem('notes');
        if (!notes || JSON.parse(notes).length === 0) {
            alert('⚠️ 沒有筆記可以匯出！');
            return;
        }
        
        const blob = new Blob([notes], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `drawing-notes-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url); // 釋放資源
    });
    
    // 匯出 Markdown
    exportMarkdownBtn.addEventListener('click', function() {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        if (notes.length === 0) {
            alert('⚠️ 沒有筆記可以匯出！');
            return;
        }
        
        let markdownContent = '';
        
        notes.forEach(note => {
            markdownContent += `# ${note.title}\n\n`;
            
            if (note.tags && note.tags.length > 0) {
                markdownContent += `標籤: ${note.tags.join(' ')}\n\n`;
            }
            
            markdownContent += `${note.content}\n\n`;
            markdownContent += `---\n\n`;
        });
        
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `drawing-notes-${new Date().toISOString().slice(0, 10)}.md`;
        a.click();
        
        URL.revokeObjectURL(url); // 釋放資源
    });
    
    // 響應式調整畫布大小
    window.addEventListener('resize', function() {
        // 儲存當前畫布內容
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 調整畫布大小
        canvas.width = canvas.parentElement.clientWidth - 20;
        
        // 恢復畫布內容
        ctx.putImageData(imageData, 0, 0);
    });
    // =====================
// 拖拽排序功能
// =====================

// 使筆記卡片可拖拽
function makeDraggable() {
    const noteCards = document.querySelectorAll('.note-card');
    const noteGrid = document.getElementById('savedNotes');
    
    // 為每個筆記卡片添加拖拽功能
    noteCards.forEach(card => {
        // 添加拖拽相關屬性和事件
        card.setAttribute('draggable', 'true');
        
        // 開始拖拽時
        card.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', card.dataset.id);
            card.classList.add('dragging');
            
            // 延遲添加視覺效果
            setTimeout(() => {
                card.style.opacity = '0.4';
            }, 0);
        });
        
        // 拖拽結束時
        card.addEventListener('dragend', function() {
            card.classList.remove('dragging');
            card.style.opacity = '1';
            saveNoteOrder(); // 保存新的筆記順序
        });
    });
    
    // 為容器添加放置區域事件
    noteGrid.addEventListener('dragover', function(e) {
        e.preventDefault(); // 允許放置
        
        const draggingElement = document.querySelector('.dragging');
        if (!draggingElement) return;
        
        const afterElement = getDragAfterElement(noteGrid, e.clientY);
        
        if (afterElement) {
            noteGrid.insertBefore(draggingElement, afterElement);
        } else {
            noteGrid.appendChild(draggingElement);
        }
    });
    
    // 處理放置事件
    noteGrid.addEventListener('drop', function(e) {
        e.preventDefault();
    });
}

// 確定要放置的位置
function getDragAfterElement(container, y) {
    // 獲取所有非拖拽中的卡片
    const cards = [...container.querySelectorAll('.note-card:not(.dragging)')];
    
    // 找出應該放在哪個元素之後
    return cards.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        // 如果是負的且比當前最近的還近
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// 保存筆記順序
function saveNoteOrder() {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const noteCards = document.querySelectorAll('.note-card');
    
    // 建立新的排序陣列
    const orderedNotes = [];
    
    noteCards.forEach(card => {
        const noteId = parseInt(card.dataset.id);
        const note = notes.find(n => n.id === noteId);
        
        if (note) {
            orderedNotes.push(note);
        }
    });
    
    // 保存新的順序
    localStorage.setItem('notes', JSON.stringify(orderedNotes));
}

// 修改displaySavedNotes函數，在顯示筆記之後調用makeDraggable
// 在displaySavedNotes函數的最後（return之前）添加：
// makeDraggable();

// 修改後的displaySavedNotes函數
function displaySavedNotes(filterTag = null) {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    savedNotes.innerHTML = '';
    
    // 如果沒有筆記，顯示提示
    if (notes.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.classList.add('empty-notes');
        emptyMsg.textContent = '尚未儲存任何筆記';
        savedNotes.appendChild(emptyMsg);
        return;
    }
    
    // 依照日期排序（新的在前）
    notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    notes.forEach((note, index) => {
        // 如果有過濾標籤且筆記不包含該標籤，則跳過
        if (filterTag && !note.tags.includes(filterTag)) {
            return;
        }
        
        const noteCard = document.createElement('div');
        noteCard.classList.add('note-card');
        noteCard.dataset.id = note.id;
        
        // 添加拖曳把手
        const dragHandle = document.createElement('div');
        dragHandle.classList.add('drag-handle');
        dragHandle.innerHTML = '↕️';
        dragHandle.title = '拖曳調整順序';
        noteCard.appendChild(dragHandle);
        
        // 筆記標題
        const titleEl = document.createElement('h3');
        titleEl.textContent = note.title;
        noteCard.appendChild(titleEl);
        
        // 筆記標籤
        if (note.tags && note.tags.length > 0) {
            const tagsContainer = document.createElement('div');
            tagsContainer.classList.add('note-tags');
            
            note.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.classList.add('tag');
                tagEl.textContent = tag;
                tagEl.addEventListener('click', function() {
                    displaySavedNotes(tag);
                    highlightActiveFilter(tag);
                });
                tagsContainer.appendChild(tagEl);
            });
            
            noteCard.appendChild(tagsContainer);
        }
        
        // 筆記內容（Markdown 解析）
        const contentEl = document.createElement('div');
        contentEl.classList.add('note-content');
        contentEl.innerHTML = marked.parse(note.content);
        noteCard.appendChild(contentEl);
        
        // 筆記圖片（如果有）
        if (note.canvasData && note.canvasData !== canvas.toDataURL('image/png', 0)) {
            const canvasImg = document.createElement('img');
            canvasImg.src = note.canvasData;
            canvasImg.classList.add('note-image');
            noteCard.appendChild(canvasImg);
        }
        
        if (note.imageData) {
            const uploadedImg = document.createElement('img');
            uploadedImg.src = note.imageData;
            uploadedImg.classList.add('note-image');
            noteCard.appendChild(uploadedImg);
        }
        
        // 按鈕容器
        const btnContainer = document.createElement('div');
        btnContainer.classList.add('note-buttons');
        
        // 編輯按鈕
        const editBtn = document.createElement('button');
        editBtn.classList.add('edit-btn');
        editBtn.textContent = '✏️ 編輯';
        editBtn.addEventListener('click', function() {
            editNote(note);
        });
        btnContainer.appendChild(editBtn);
        
        // 刪除按鈕
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-btn');
        deleteBtn.textContent = '🗑️ 刪除';
        deleteBtn.addEventListener('click', function() {
            if (confirm('確定要刪除這個筆記嗎？')) {
                deleteNote(index);
            }
        });
        btnContainer.appendChild(deleteBtn);
        
        noteCard.appendChild(btnContainer);
        savedNotes.appendChild(noteCard);
    });
    
    // 啟用拖曳功能
    makeDraggable();
}

});
