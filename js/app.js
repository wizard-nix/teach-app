document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const STORAGE_KEY = 'studentProgressTracker';
    let students = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    let currentStudentId = null;

    // --- DOM Elements ---
    const studentListEl = document.getElementById('students-list');
    const emptyStateEl = document.getElementById('empty-state');
    const studentContentEl = document.getElementById('student-content');
    const currentStudentNameEl = document.getElementById('current-student-name');
    const currentStudentStatsEl = document.getElementById('current-student-stats');
    const topicsListEl = document.getElementById('topics-list');
    
    // Problems UI
    const problemsViewContainer = document.getElementById('problems-view-container');
    const problemsView = document.getElementById('problems-view');
    const problemsEmpty = document.getElementById('problems-empty');
    const problemsEditContainer = document.getElementById('problems-edit-container');
    const inputStudentProblems = document.getElementById('input-student-problems');
    const btnEditProblems = document.getElementById('btn-edit-problems');
    const btnCancelProblems = document.getElementById('btn-cancel-problems');
    const btnSaveProblems = document.getElementById('btn-save-problems');

    // Sidebar Mobile
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const btnOpenSidebar = document.getElementById('btn-open-sidebar');
    const btnOpenSidebarEmpty = document.getElementById('btn-open-sidebar-empty');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar');

    // Buttons
    const btnOpenStudentModal = document.getElementById('btn-open-student-modal');
    const btnOpenTopicModal = document.getElementById('btn-open-topic-modal');
    const btnDeleteStudent = document.getElementById('btn-delete-student');
    const closeModals = document.querySelectorAll('.close-modal');
    
    // Modals
    const modalStudent = document.getElementById('modal-student');
    const modalTopic = document.getElementById('modal-topic');
    
    // Forms
    const formStudent = document.getElementById('form-student');
    const inputStudentName = document.getElementById('input-student-name');
    
    const formTopic = document.getElementById('form-topic');
    const modalTopicTitle = document.getElementById('modal-topic-title');
    const inputTopicId = document.getElementById('input-topic-id');
    const inputTopicName = document.getElementById('input-topic-name');
    const inputTopicDate = document.getElementById('input-topic-date');
    const inputTopicProgress = document.getElementById('input-topic-progress');
    const progressValDisplay = document.getElementById('progress-val-display');
    const inputTopicNotes = document.getElementById('input-topic-notes');

    // --- Helpers ---
    const saveState = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    };

    const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

    const escapeHTML = (str) => {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    };

    const extractLinks = (text) => {
        if (!text) return [];
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const links = [];
        let match;
        while ((match = urlRegex.exec(text)) !== null) {
            links.push(match[1]);
        }
        return [...new Set(links)]; // Return unique links
    };
    
    const formatUrl = (url, maxLength = 45) => {
        if (url.length <= maxLength) return url;
        const start = Math.ceil(maxLength * 0.55);
        const end = Math.floor(maxLength * 0.35);
        return url.substring(0, start) + '...' + url.substring(url.length - end);
    };

    const copyToClipboard = async (text, btnElement) => {
        try {
            await navigator.clipboard.writeText(text);
            const originalHTML = btnElement.innerHTML;
            btnElement.innerHTML = `<svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>`;
            btnElement.classList.add('bg-emerald-500/20');
            setTimeout(() => {
                btnElement.innerHTML = originalHTML;
                btnElement.classList.remove('bg-emerald-500/20');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    // --- Mobile Sidebar Logic ---
    const openSidebar = () => {
        sidebar.classList.remove('-translate-x-full');
        mobileOverlay.classList.remove('hidden');
        setTimeout(() => mobileOverlay.classList.remove('opacity-0'), 10);
    };

    const closeSidebar = () => {
        sidebar.classList.add('-translate-x-full');
        mobileOverlay.classList.add('opacity-0');
        setTimeout(() => mobileOverlay.classList.add('hidden'), 300);
    };

    if (btnOpenSidebar) btnOpenSidebar.addEventListener('click', openSidebar);
    if (btnOpenSidebarEmpty) btnOpenSidebarEmpty.addEventListener('click', openSidebar);
    if (btnCloseSidebar) btnCloseSidebar.addEventListener('click', closeSidebar);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeSidebar);

    // --- Modal Logic ---
    const openModal = (modal) => {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('.transform').classList.remove('scale-95');
        }, 10);
    };

    const closeModal = (modal) => {
        modal.classList.add('opacity-0');
        modal.querySelector('.transform').classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 200);
    };

    closeModals.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.fixed.inset-0');
            if (modal) closeModal(modal);
        });
    });

    [modalStudent, modalTopic].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    // --- UI Render ---
    const renderStudentsList = () => {
        studentListEl.innerHTML = '';
        if (students.length === 0) {
            studentListEl.innerHTML = '<li class="text-zinc-500 text-sm text-center py-6 border border-dashed border-zinc-800 rounded-xl mt-2">Список пуст</li>';
            return;
        }

        students.forEach(student => {
            const li = document.createElement('li');
            const isActive = student.id === currentStudentId;
            li.className = `
                flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200
                ${isActive 
                    ? 'bg-zinc-800 text-zinc-100 font-medium border border-zinc-700 shadow-md' 
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'}
            `;
            
            li.innerHTML = `
                <div class="flex items-center gap-3 truncate">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors
                        ${isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}">
                        ${student.name.charAt(0).toUpperCase()}
                    </div>
                    <span class="truncate">${student.name}</span>
                </div>
            `;
            li.addEventListener('click', () => {
                selectStudent(student.id);
                if (window.innerWidth < 768) {
                    closeSidebar();
                }
            });
            studentListEl.appendChild(li);
        });
    };

    const getProgressColors = (val) => {
        if (val < 40) return { bar: 'bg-rose-500', text: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' };
        if (val < 80) return { bar: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
        return { bar: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    };

    const renderProblems = () => {
        const student = students.find(s => s.id === currentStudentId);
        if (!student) return;
        
        problemsEditContainer.classList.add('hidden');
        problemsEditContainer.classList.remove('flex');
        problemsViewContainer.classList.remove('hidden');
        problemsViewContainer.classList.add('block');
        btnEditProblems.classList.remove('hidden');
        
        const problemsText = student.problems || '';
        
        if (problemsText.trim() !== '') {
            let safeText = escapeHTML(problemsText);
            // Replace URLs in problems text with clickable links
            safeText = safeText.replace(/(https?:\/\/[^\s]+)/g, (match) => {
                return `<a href="${match}" target="_blank" class="text-rose-400 hover:text-rose-300 underline underline-offset-2 break-all transition-colors" title="${match}">${formatUrl(match, 50)}</a>`;
            });
            
            problemsView.innerHTML = safeText;
            problemsView.classList.remove('hidden');
            problemsEmpty.classList.add('hidden');
        } else {
            problemsView.classList.add('hidden');
            problemsEmpty.classList.remove('hidden');
        }
    };

    const renderTopics = () => {
        const student = students.find(s => s.id === currentStudentId);
        if (!student) return;

        currentStudentNameEl.textContent = student.name;
        currentStudentNameEl.title = student.name;
        
        const topics = student.topics || [];
        const completed = topics.filter(t => t.progress == 100).length;
        currentStudentStatsEl.textContent = `Пройдено тем: ${completed} из ${topics.length}`;

        topicsListEl.innerHTML = '';
        if (topics.length === 0) {
            topicsListEl.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
                    <div class="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                        <svg class="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    </div>
                    <h3 class="text-lg font-medium text-zinc-300">Пока нет тем</h3>
                    <p class="text-sm text-zinc-500 mt-1 max-w-xs">Нажмите «Добавить тему», чтобы начать отслеживать прогресс.</p>
                </div>
            `;
            return;
        }

        const sortedTopics = [...topics].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedTopics.forEach(topic => {
            const card = document.createElement('div');
            card.className = "bg-zinc-900 rounded-2xl p-5 md:p-6 border border-zinc-800 shadow-sm hover:border-zinc-700 hover:shadow-xl hover:shadow-black/20 transition-all flex flex-col h-full relative group";
            
            const colors = getProgressColors(topic.progress);
            
            // --- URL Parsing Logic ---
            const links = extractLinks(topic.notes);
            let safeNotes = escapeHTML(topic.notes);
            
            // Replace URLs in text with clickable links (truncated in the middle)
            safeNotes = safeNotes.replace(/(https?:\/\/[^\s]+)/g, (match) => {
                return `<a href="${match}" target="_blank" class="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 break-all transition-colors" title="${match}">${formatUrl(match, 50)}</a>`;
            });

            const linksHTML = links.length > 0 ? `
                <div class="mt-4 pt-3 border-t border-zinc-700/50 flex flex-col gap-2">
                    <span class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Прикрепленные ссылки</span>
                    ${links.map(link => `
                        <div class="flex items-center gap-2 bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/80 group/link hover:border-zinc-700 transition-colors">
                            <div class="w-7 h-7 rounded bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                            </div>
                            <a href="${link}" target="_blank" class="flex-1 text-zinc-300 hover:text-indigo-300 text-xs transition-colors whitespace-nowrap overflow-hidden" title="${link}">${formatUrl(link, 45)}</a>
                            <button class="btn-copy-link text-zinc-500 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-md transition-colors opacity-100 md:opacity-0 md:group-hover/link:opacity-100 focus:opacity-100 flex-shrink-0" data-link="${link}" title="Копировать ссылку">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                            </button>
                        </div>
                    `).join('')}
                </div>
            ` : '';
            // ---------------------------

            card.innerHTML = `
                <div class="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button class="btn-edit-topic text-zinc-500 hover:text-indigo-400 bg-zinc-800 md:bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg p-2 transition-colors" title="Редактировать">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button class="btn-delete-topic text-zinc-500 hover:text-rose-400 bg-zinc-800 md:bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg p-2 transition-colors" title="Удалить">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
                <div class="flex-1 mt-1 flex flex-col">
                    <div class="flex justify-between items-start mb-3 pr-20">
                        <h3 class="font-bold text-zinc-100 leading-tight text-lg">${topic.name}</h3>
                    </div>
                    <div class="text-xs text-zinc-400 mb-5 flex items-center gap-1.5 font-medium">
                        <svg class="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        ${new Date(topic.date).toLocaleDateString('ru-RU')}
                    </div>
                    <div class="mb-5 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-xs font-medium text-zinc-400">Прогресс</span>
                            <span class="text-xs font-bold ${colors.text}">${topic.progress}%</span>
                        </div>
                        <div class="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div class="${colors.bar} h-1.5 rounded-full transition-all duration-700 ease-out" style="width: ${topic.progress}%"></div>
                        </div>
                    </div>
                    ${topic.notes ? `
                        <div class="text-sm text-zinc-400 bg-zinc-800/30 p-3.5 rounded-xl border border-zinc-800/80 leading-relaxed mt-auto flex flex-col">
                            <div class="whitespace-pre-wrap break-words">${safeNotes}</div>
                            ${linksHTML}
                        </div>
                    ` : ''}
                </div>
            `;

            card.querySelector('.btn-edit-topic').addEventListener('click', () => editTopic(topic));
            card.querySelector('.btn-delete-topic').addEventListener('click', () => deleteTopic(topic.id));
            
            // Link copy listeners
            card.querySelectorAll('.btn-copy-link').forEach(btn => {
                btn.addEventListener('click', () => {
                    const link = btn.getAttribute('data-link');
                    copyToClipboard(link, btn);
                });
            });

            topicsListEl.appendChild(card);
        });
    };

    const selectStudent = (id) => {
        currentStudentId = id;
        emptyStateEl.classList.add('hidden');
        studentContentEl.classList.remove('hidden');
        studentContentEl.classList.add('flex');
        
        renderStudentsList();
        renderProblems();
        renderTopics();
    };

    // --- Problems Actions ---
    btnEditProblems.addEventListener('click', () => {
        const student = students.find(s => s.id === currentStudentId);
        if (!student) return;
        
        inputStudentProblems.value = student.problems || '';
        
        problemsViewContainer.classList.add('hidden');
        problemsViewContainer.classList.remove('block');
        btnEditProblems.classList.add('hidden');
        
        problemsEditContainer.classList.remove('hidden');
        problemsEditContainer.classList.add('flex');
        
        inputStudentProblems.focus();
    });
    
    btnCancelProblems.addEventListener('click', () => {
        renderProblems(); // Revert back to view mode
    });
    
    btnSaveProblems.addEventListener('click', () => {
        const student = students.find(s => s.id === currentStudentId);
        if (!student) return;
        
        student.problems = inputStudentProblems.value.trim();
        saveState();
        renderProblems();
    });

    // --- Actions ---
    btnOpenStudentModal.addEventListener('click', () => {
        formStudent.reset();
        openModal(modalStudent);
        setTimeout(() => inputStudentName.focus(), 100);
    });

    formStudent.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = inputStudentName.value.trim();
        if (name) {
            const newStudent = { id: generateId(), name, problems: '', topics: [] };
            students.push(newStudent);
            saveState();
            closeModal(modalStudent);
            selectStudent(newStudent.id);
            if (window.innerWidth < 768) closeSidebar();
        }
    });

    btnDeleteStudent.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите удалить этого ученика и все его темы?')) {
            students = students.filter(s => s.id !== currentStudentId);
            saveState();
            currentStudentId = null;
            
            studentContentEl.classList.add('hidden');
            studentContentEl.classList.remove('flex');
            emptyStateEl.classList.remove('hidden');
            
            renderStudentsList();
        }
    });

    btnOpenTopicModal.addEventListener('click', () => {
        formTopic.reset();
        inputTopicId.value = '';
        modalTopicTitle.textContent = 'Новая тема';
        inputTopicDate.valueAsDate = new Date();
        inputTopicProgress.value = 0;
        
        const colors = getProgressColors(0);
        progressValDisplay.textContent = '0%';
        progressValDisplay.className = `text-sm font-semibold px-2 py-0.5 rounded-md border ${colors.text} ${colors.bg}`;
        
        openModal(modalTopic);
        setTimeout(() => inputTopicName.focus(), 100);
    });

    inputTopicProgress.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        const colors = getProgressColors(val);
        
        progressValDisplay.textContent = val + '%';
        progressValDisplay.className = `text-sm font-semibold px-2 py-0.5 rounded-md border transition-colors ${colors.text} ${colors.bg}`;
    });

    formTopic.addEventListener('submit', (e) => {
        e.preventDefault();
        const student = students.find(s => s.id === currentStudentId);
        if (!student) return;

        const topicId = inputTopicId.value;
        const topicData = {
            id: topicId || generateId(),
            name: inputTopicName.value.trim(),
            date: inputTopicDate.value,
            progress: parseInt(inputTopicProgress.value, 10),
            notes: inputTopicNotes.value.trim()
        };

        if (topicId) {
            const index = student.topics.findIndex(t => t.id === topicId);
            if (index !== -1) student.topics[index] = topicData;
        } else {
            student.topics.push(topicData);
        }

        saveState();
        renderTopics();
        closeModal(modalTopic);
    });

    const editTopic = (topic) => {
        modalTopicTitle.textContent = 'Редактировать тему';
        inputTopicId.value = topic.id;
        inputTopicName.value = topic.name;
        inputTopicDate.value = topic.date;
        inputTopicProgress.value = topic.progress;
        inputTopicNotes.value = topic.notes;
        
        inputTopicProgress.dispatchEvent(new Event('input'));
        openModal(modalTopic);
    };

    const deleteTopic = (topicId) => {
        if (confirm('Удалить эту тему?')) {
            const student = students.find(s => s.id === currentStudentId);
            if (student) {
                student.topics = student.topics.filter(t => t.id !== topicId);
                saveState();
                renderTopics();
            }
        }
    };

    // --- Init ---
    renderStudentsList();
    if (students.length > 0) {
        selectStudent(students[0].id);
    }
});
