// ============================================
// JAGAT EDUCATION CENTER - FRONTEND LOGIC
// ============================================

// ⚠️ GANTI URL DI BAWAH DENGAN URL WEB APP APPS SCRIPT ANDA
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxywGupKGwsfx9Fm-hb2lYld4resnDm-hqOWowJ33MPPBl70LSMM7B_teeqfF4I-odv/exec";

// ===== DOM ELEMENTS =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const viewForm = $('#viewForm');
const viewSuccess = $('#viewSuccess');
const form = $('#registrationForm');
const modalPanduan = $('#modalPanduan');
const modalReview = $('#modalReview');
const modalError = $('#modalError');
const reviewContainer = $('#reviewDataContainer');
const errorMessage = $('#errorMessage');
const loadingOverlay = $('#loadingOverlay');

let formData = {};

// ===== LOCALSTORAGE FUNCTIONS =====
const STORAGE_KEY = 'jec_registration_form';

function saveToLocalStorage() {
    const formData = {};
    const elements = form.elements;
    
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (!el.name || el.type === 'submit' || el.type === 'button') continue;
        
        if (el.type === 'radio') {
            if (el.checked) {
                formData[el.name] = el.value;
            }
        } else if (el.type === 'checkbox') {
            if (el.checked) {
                if (!formData[el.name]) formData[el.name] = [];
                formData[el.name].push(el.value);
            }
        } else {
            if (el.value.trim()) {
                formData[el.name] = el.value.trim();
            }
        }
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return;
    
    try {
        const data = JSON.parse(savedData);
        const elements = form.elements;
        
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (!el.name) continue;
            
            if (el.type === 'radio') {
                if (data[el.name]) {
                    el.checked = (el.value === data[el.name]);
                }
            } else if (el.type === 'checkbox') {
                if (data[el.name] && data[el.name].includes(el.value)) {
                    el.checked = true;
                }
            } else if (el.type !== 'submit' && el.type !== 'button') {
                if (data[el.name]) {
                    el.value = data[el.name];
                }
            }
        }
    } catch (e) {
        console.error('Error loading from localStorage:', e);
    }
}

function clearLocalStorage() {
    localStorage.removeItem(STORAGE_KEY);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage(); // Load saved data
    initEventListeners();
    initTextAnimation();
});

// ===== TEXT ANIMATION LOGIC =====
function initTextAnimation() {
    const brandTexts = document.querySelectorAll('.brand-text');
    if (brandTexts.length < 2) return;

    let currentIndex = 0;
    
    function switchText() {
        const current = brandTexts[currentIndex];
        const next = brandTexts[(currentIndex + 1) % brandTexts.length];
        
        current.classList.add('exit');
        current.classList.remove('active');
        
        setTimeout(() => {
            current.classList.remove('exit');
            next.classList.add('active');
        }, 500);
        
        currentIndex = (currentIndex + 1) % brandTexts.length;
    }
    
    setTimeout(() => {
        switchText();
        setInterval(switchText, 4000);
    }, 3000);
}

// ===== EVENT LISTENERS =====
function initEventListeners() {
    // Button Events
    $('#btnPanduan').addEventListener('click', () => openModal(modalPanduan));
    $('#btnCekFormulir').addEventListener('click', handleCekFormulir);
    $('#btnKirimData').addEventListener('click', handleKirimData);
    $('#btnKonfirmasiWA').addEventListener('click', handleKonfirmasiWA);
    $('#btnKembaliAwal').addEventListener('click', resetForm);

    // Close Modal Events - Direct binding untuk semua close buttons
    $$('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetModal = $(`#${targetId}`);
            if (targetModal) {
                closeModal(targetModal);
            }
        });
    });

    // Close modal on overlay click
    $$('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
            }
        });
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            $$('.modal-overlay.active').forEach(m => closeModal(m));
        }
    });

    // Auto-save to localStorage on input change
    form.addEventListener('input', saveToLocalStorage);
    form.addEventListener('change', saveToLocalStorage);

    // Auto-fill "Sumber Informasi Lainnya" into radio logic
    const sumberLainnya = $('#sumberLainnya');
    if (sumberLainnya) {
        sumberLainnya.addEventListener('input', () => {
            if (sumberLainnya.value.trim()) {
                $$('input[name="Sumber Informasi"]').forEach(r => r.checked = false);
            }
            saveToLocalStorage();
        });
    }
}

// ===== MODAL FUNCTIONS =====
function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ===== FORM VALIDATION =====
function validateForm() {
    const errors = [];
    
    const requiredInputs = form.querySelectorAll('input[required]:not([type="radio"])');
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            const label = form.querySelector(`label[for="${input.id}"]`);
            const fieldName = label ? label.textContent.replace(' *', '').trim() : input.name;
            errors.push(fieldName);
        }
    });

    const requiredTextareas = form.querySelectorAll('textarea[required]');
    requiredTextareas.forEach(ta => {
        if (!ta.value.trim()) {
            errors.push('Alamat');
        }
    });

    const requiredRadios = form.querySelectorAll('input[type="radio"][required]');
    const checkedGroups = new Set();
    requiredRadios.forEach(radio => {
        if (!checkedGroups.has(radio.name)) {
            const groupChecked = form.querySelector(`input[name="${radio.name}"]:checked`);
            if (!groupChecked) {
                const label = radio.closest('.form-group')?.querySelector(':scope > label');
                const fieldName = label ? label.textContent.replace(' *', '').trim() : radio.name;
                errors.push(fieldName);
            }
            checkedGroups.add(radio.name);
        }
    });

    return [...new Set(errors)];
}

// ===== COLLECT FORM DATA =====
function collectFormData() {
    const data = {};
    const elements = form.elements;

    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (!el.name) continue;

        if (el.type === 'radio') {
            if (el.checked) {
                data[el.name] = el.value;
            }
        } else if (el.type !== 'submit' && el.type !== 'button') {
            if (el.value.trim()) {
                data[el.name] = el.value.trim();
            }
        }
    }

    const sumberLainnya = $('#sumberLainnya').value.trim();
    if (sumberLainnya && !data['Sumber Informasi']) {
        data['Sumber Informasi'] = 'Lainnya: ' + sumberLainnya;
    }

    return data;
}

// ===== HANDLE CEK FORMULIR =====
function handleCekFormulir() {
    const errors = validateForm();

    if (errors.length > 0) {
        errorMessage.innerHTML = `
            <p>Mohon lengkapi field berikut yang belum diisi:</p>
            <ul style="margin-top:10px; padding-left:20px;">
                ${errors.map(e => `<li style="margin-bottom:4px;"><strong>${e}</strong></li>`).join('')}
            </ul>
        `;
        openModal(modalError);
        return;
    }

    formData = collectFormData();
    renderReview();
    openModal(modalReview);
}

// ===== RENDER REVIEW =====
function renderReview() {
    const sections = {
        '❶ Personal Info': ['Nama Siswa Lengkap', 'Nama Panggilan', 'TTL', 'Jenis Kelamin'],
        '❷ Data Pendidikan': ['Jenjang Sekolah', 'Nama Asal Sekolah', 'Kelas', 'Alamat', 'Email', 'No HP/WA'],
        '❸ Data Orang Tua': ['Nama Ayah', 'Nama Ibu', 'No HP/WA Orang Tua'],
        '❹ Program & Layanan': ['Program', 'Service', 'Sumber Informasi']
    };

    let html = '';

    for (const [sectionTitle, fields] of Object.entries(sections)) {
        const sectionData = {};
        fields.forEach(field => {
            if (formData[field]) {
                sectionData[field] = formData[field];
            }
        });

        if (Object.keys(sectionData).length > 0) {
            html += `<div class="review-section">
                <div class="review-section-title">${sectionTitle}</div>`;
            
            for (const [key, value] of Object.entries(sectionData)) {
                html += `<div class="review-item">
                    <span class="review-label">${key}</span>
                    <span class="review-value">${value}</span>
                </div>`;
            }
            html += '</div>';
        }
    }

    reviewContainer.innerHTML = html;
}

// ===== HANDLE KIRIM DATA =====
async function handleKirimData() {
    // Check if URL is still default
    if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
        errorMessage.innerHTML = `
            <p><strong>Konfigurasi belum lengkap!</strong></p>
            <p style="margin-top:8px;">URL Apps Script belum diatur di file script.js</p>
            <p style="margin-top:8px; font-size:0.85rem; color:var(--text-secondary);">
                Silakan hubungi administrator untuk melengkapi konfigurasi.
            </p>
        `;
        openModal(modalError);
        return;
    }

    closeModal(modalReview);
    loadingOverlay.classList.add('active');

    try {
        const payload = new FormData();
        for (const [key, value] of Object.entries(formData)) {
            payload.append(key, value);
        }

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: payload
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.status === 'success') {
            // Clear localStorage after successful submission
            clearLocalStorage();
            showSuccessView();
        } else {
            throw new Error(result.message || 'Server mengembalikan error');
        }

    } catch (error) {
        console.error('Error sending data:', error);
        
        // Handle specific error messages
        let errorDetail = error.message;
        let errorHint = 'Pastikan koneksi internet stabil dan coba lagi.';
        
        if (error.message.includes('404')) {
            errorDetail = 'URL Apps Script tidak ditemukan (404 Not Found)';
            errorHint = 'Pastikan URL Apps Script sudah benar dan sudah di-deploy sebagai Web App.';
        } else if (error.message.includes('403')) {
            errorDetail = 'Akses ditolak (403 Forbidden)';
            errorHint = 'Pastikan Web App Apps Script diatur dengan akses "Anyone".';
        } else if (error.message.includes('Failed to fetch')) {
            errorDetail = 'Gagal terhubung ke server';
            errorHint = 'Periksa koneksi internet Anda atau coba lagi nanti.';
        }
        
        errorMessage.innerHTML = `
            <p>Terjadi kesalahan saat mengirim data:</p>
            <p style="margin-top:8px; color:var(--error); font-family:monospace; font-size:0.85rem; background:var(--error-light); padding:8px; border-radius:6px;">
                ${errorDetail}
            </p>
            <p style="margin-top:12px; font-size:0.9rem;">${errorHint}</p>
        `;
        openModal(modalError);
    } finally {
        loadingOverlay.classList.remove('active');
    }
}

// ===== SHOW SUCCESS VIEW =====
function showSuccessView() {
    viewForm.classList.remove('active');
    viewSuccess.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== RESET FORM =====
function resetForm() {
    form.reset();
    formData = {};
    clearLocalStorage(); // Clear saved data
    viewSuccess.classList.remove('active');
    viewForm.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== WHATSAPP CONFIRMATION =====
function handleKonfirmasiWA() {
    const nama = formData['Nama Siswa Lengkap'] || 'Siswa';
    const program = formData['Program'] || 'Program belum dipilih';
    const service = formData['Service'] || '';

    const message = `Halo Admin Jagat Education Center (JEC),

Saya sudah mendaftar dengan data berikut:
👤 Nama: ${nama}
📚 Program: ${program}
${service ? '🎯 Layanan: ' + service : ''}

Mohon konfirmasi pendaftarannya. Terima kasih!`;

    const encodedMessage = encodeURIComponent(message);
    const waNumber = "6285335913758";
    const waUrl = `https://wa.me/${waNumber}?text=${encodedMessage}`;
    
    window.open(waUrl, '_blank');
}