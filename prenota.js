/* ==========================================================================
   ANTITESI PIZZERIA - Prenota Page JavaScript
   ========================================================================== */

// API Configuration - Auto-detect environment
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://pizzeria-prenotazioni-production.up.railway.app';

// Booking State
const booking = {
    date: null,
    dateFormatted: null,
    dateShort: null,
    persons: null,
    time: null,
    title: '',
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    hasDog: false,
    hasHighchair: false,
    hasWheelchair: false
};

// Configurazione dinamica dal backend
let config = {
    maxPersone: 8,
    patternSettimanale: {
        lunedi: false, martedi: true, mercoledi: true,
        giovedi: true, venerdi: true, sabato: true, domenica: true
    },
    chiusureStraordinarie: [],
    fascePrenotazione: {},
    waitlistEnabled: false,
    configLoaded: false
};

// Mappa giorni settimana JS -> italiano
const giorniMap = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];

const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

// Calendar State
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// DOM Elements
let stepTabs, stepContents;

/* --------------------------------------------------------------------------
   Utility
   -------------------------------------------------------------------------- */

// Helper per formattare date SENZA problemi timezone
function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Converte date in formato europeo DD-MM-YYYY per il backend
function formatDateEU(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Mostra errore inline (no alert)
function showError(container, message, retryFn) {
    const existing = container.querySelector('.error-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.className = 'error-banner';
    banner.innerHTML = `
        <p>${message}</p>
        ${retryFn ? '<button class="btn-retry">Riprova</button>' : ''}
    `;

    if (retryFn) {
        banner.querySelector('.btn-retry').addEventListener('click', () => {
            banner.remove();
            retryFn();
        });
    }

    container.appendChild(banner);
}

/* --------------------------------------------------------------------------
   Config Loading
   -------------------------------------------------------------------------- */

async function caricaConfigurazione() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/website/config`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.ok) {
            config.maxPersone = data.max_persone || 8;
            config.patternSettimanale = data.pattern_settimanale || config.patternSettimanale;
            config.chiusureStraordinarie = data.chiusure_straordinarie || [];
            config.fascePrenotazione = data.fasce_prenotazione || {};
            config.waitlistEnabled = data.waitlist_enabled || false;
            config.configLoaded = true;
            console.log('Configurazione caricata:', config);
            renderCalendar();
            renderPersoneButtons();
        }
    } catch (error) {
        console.warn('Configurazione non caricata, uso default:', error);
        // Il calendario funziona comunque con i valori di default
    }
}

/* --------------------------------------------------------------------------
   Calendar
   -------------------------------------------------------------------------- */

function renderCalendar() {
    const daysContainer = document.getElementById('calendar-days');
    const monthLabel = document.getElementById('current-month');

    monthLabel.textContent = `${months[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    let html = '';

    // Empty cells for days before month starts
    for (let i = 0; i < startingDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    // Days of month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateISO = formatDateLocal(date);
        const isToday = date.getTime() === today.getTime();
        const isPast = date < today;

        // Usa configurazione dinamica per giorni chiusi
        const giornoSettimana = giorniMap[date.getDay()];
        const apertoPerPattern = config.patternSettimanale[giornoSettimana] !== false;
        const chiusoStraordinario = config.chiusureStraordinarie.includes(dateISO);
        const isDisabled = isPast || !apertoPerPattern || chiusoStraordinario;

        let classes = 'calendar-day';
        if (isToday) classes += ' today';
        if (isDisabled) classes += ' disabled';
        if (booking.date && date.getTime() === booking.date.getTime()) classes += ' selected';

        html += `<div class="${classes}" data-date="${dateISO}">${day}</div>`;
    }

    daysContainer.innerHTML = html;

    // Add click handlers
    document.querySelectorAll('.calendar-day:not(.disabled):not(.empty)').forEach(day => {
        day.addEventListener('click', () => selectDate(day));
    });
}

function selectDate(dayEl) {
    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
    dayEl.classList.add('selected');

    const parts = dayEl.dataset.date.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const monthsShort = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

    booking.date = date;
    booking.dateFormatted = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    booking.dateShort = `${days[date.getDay()]} ${date.getDate()} ${monthsShort[date.getMonth()]}`;

    document.getElementById('to-step-2').disabled = false;
    BookingAnalytics.track('booking_step_completed', 'data');
}

/* --------------------------------------------------------------------------
   Persone
   -------------------------------------------------------------------------- */

function renderPersoneButtons() {
    const container = document.querySelector('.persons-grid');
    container.innerHTML = '';

    for (let i = 1; i <= config.maxPersone; i++) {
        const btn = document.createElement('button');
        btn.className = 'person-btn';
        btn.dataset.persons = i;
        btn.textContent = i;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.person-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            booking.persons = i;
            document.getElementById('to-step-3').disabled = false;
        });
        container.appendChild(btn);
    }

    const moreLink = document.getElementById('persons-more-link');
    if (moreLink) {
        moreLink.textContent = `Più di ${config.maxPersone} persone? Chiamaci`;
    }
}

/* --------------------------------------------------------------------------
   Time Slots
   -------------------------------------------------------------------------- */

async function caricaSlotOrari() {
    if (!booking.date || !booking.persons) return;

    const dateEU = formatDateEU(booking.date);
    const timeGrid = document.querySelector('.time-grid');
    const timeSection = document.querySelector('.time-section');

    // Skeleton loading
    timeGrid.innerHTML = `
        <div class="skeleton-grid">
            <div class="skeleton-slot"></div>
            <div class="skeleton-slot"></div>
            <div class="skeleton-slot"></div>
            <div class="skeleton-slot"></div>
            <div class="skeleton-slot"></div>
            <div class="skeleton-slot"></div>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/api/website/disponibilita/${dateEU}?persone=${booking.persons}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.ok && data.aperto) {
            renderTimeSlots(data.slot_disponibili, data.modo_turno);
        } else {
            timeGrid.innerHTML = '<div class="no-slots">Nessun orario disponibile per questa data</div>';
        }
    } catch (error) {
        console.error('Errore caricamento slot:', error);
        timeGrid.innerHTML = '';
        showError(timeGrid, 'Impossibile caricare gli orari. Verifica la connessione.', caricaSlotOrari);
    }
}

function renderTimeSlots(slots, modoTurno) {
    const timeGrid = document.querySelector('.time-grid');
    const timeSection = document.querySelector('.time-section');

    const timeLabel = timeSection.querySelector('.time-label');
    timeLabel.textContent = modoTurno === 'unico' ? 'Sera' : 'Seleziona orario';

    let html = '';

    if (modoTurno === 'doppio') {
        const turno1 = slots.filter(s => s.turno === 'turno_1');
        const turno2 = slots.filter(s => s.turno === 'turno_2');

        const turno1Pieno = turno1.length > 0 && turno1.every(s => !s.disponibile);
        const turno2Pieno = turno2.length > 0 && turno2.every(s => !s.disponibile);

        if (turno1.length > 0) {
            html += '<div class="turno-group"><div class="turno-label">Primo Turno</div><div class="turno-slots">';
            turno1.forEach(slot => {
                const cls = slot.disponibile ? '' : 'unavailable';
                const dis = slot.disponibile ? '' : 'disabled';
                html += `<button class="time-btn ${cls}" data-time="${slot.ora}" ${dis}>${slot.ora}</button>`;
            });
            html += '</div>';
            if (turno1Pieno && config.waitlistEnabled) {
                html += renderWaitlistNotice('turno_1', 'Primo Turno');
            }
            html += '</div>';
        }

        if (turno2.length > 0) {
            html += '<div class="turno-group"><div class="turno-label">Secondo Turno</div><div class="turno-slots">';
            turno2.forEach(slot => {
                const cls = slot.disponibile ? '' : 'unavailable';
                const dis = slot.disponibile ? '' : 'disabled';
                html += `<button class="time-btn ${cls}" data-time="${slot.ora}" ${dis}>${slot.ora}</button>`;
            });
            html += '</div>';
            if (turno2Pieno && config.waitlistEnabled) {
                html += renderWaitlistNotice('turno_2', 'Secondo Turno');
            }
            html += '</div>';
        }
    } else {
        const turnoUnicoPieno = slots.length > 0 && slots.every(s => !s.disponibile);

        slots.forEach(slot => {
            const cls = slot.disponibile ? '' : 'unavailable';
            const dis = slot.disponibile ? '' : 'disabled';
            html += `<button class="time-btn ${cls}" data-time="${slot.ora}" ${dis}>${slot.ora}</button>`;
        });

        if (turnoUnicoPieno && config.waitlistEnabled) {
            html += renderWaitlistNotice('turno_1', 'questa sera');
        }
    }

    timeGrid.innerHTML = html;

    // Event listeners time buttons
    document.querySelectorAll('.time-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            booking.time = btn.dataset.time;
            document.getElementById('to-step-4').disabled = false;
        });
    });

    // Event listeners waitlist buttons
    document.querySelectorAll('.btn-waitlist').forEach(btn => {
        btn.addEventListener('click', () => {
            openWaitlistModal(btn.dataset.turno, btn.dataset.turnoLabel);
        });
    });
}

function renderWaitlistNotice(turno, turnoLabel) {
    return `
        <div class="waitlist-notice">
            <p>Turno pieno! Vuoi entrare in lista d'attesa per ${turnoLabel}?</p>
            <button class="btn-waitlist" data-turno="${turno}" data-turno-label="${turnoLabel}">
                Entra in Lista d'Attesa
            </button>
            <p class="waitlist-disclaimer">La richiamata non è assicurata</p>
        </div>
    `;
}

// Fallback: orari statici
function renderStaticTimeSlots() {
    const timeGrid = document.querySelector('.time-grid');
    const staticSlots = ['19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'];

    timeGrid.innerHTML = staticSlots.map(ora =>
        `<button class="time-btn" data-time="${ora}">${ora}</button>`
    ).join('');

    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            booking.time = btn.dataset.time;
            document.getElementById('to-step-4').disabled = false;
        });
    });
}

/* --------------------------------------------------------------------------
   Step Navigation
   -------------------------------------------------------------------------- */

function goToStep(stepNum) {
    stepTabs.forEach(tab => {
        const tabStep = parseInt(tab.dataset.step);
        tab.classList.remove('active', 'completed');
        if (tabStep < stepNum || (stepNum === 5 && tabStep <= 4)) tab.classList.add('completed');
        if (tabStep === stepNum) tab.classList.add('active');
    });

    stepContents.forEach(content => content.classList.remove('active'));

    if (stepNum === 4) {
        document.getElementById('step-4').classList.add('active');
        updateSummaryBar();
    } else if (stepNum === 5) {
        document.getElementById('step-summary').classList.add('active');
        updateSummary();
    } else {
        document.getElementById(`step-${stepNum}`).classList.add('active');
    }
}

function updateSummaryBar() {
    document.getElementById('bar-date').textContent = booking.dateShort || '-';
    document.getElementById('bar-persons').textContent = booking.persons ? `${booking.persons} Persone` : '-';
    document.getElementById('bar-time').textContent = booking.time || '-';
}

function updateSummary() {
    const fullName = booking.nome && booking.cognome
        ? `${booking.title ? booking.title + ' ' : ''}${booking.nome} ${booking.cognome}`
        : '-';
    document.getElementById('summary-name').textContent = fullName;
    document.getElementById('summary-date').textContent = booking.dateFormatted || '-';
    document.getElementById('summary-persons').textContent = booking.persons
        ? `${booking.persons} ${booking.persons === 1 ? 'persona' : 'persone'}`
        : '-';
    document.getElementById('summary-time').textContent = booking.time || '-';
    document.getElementById('summary-phone').textContent = booking.telefono ? `+39 ${booking.telefono}` : '-';
}

/* --------------------------------------------------------------------------
   Form Validation
   -------------------------------------------------------------------------- */

function validateForm() {
    const nome = document.getElementById('input-nome').value.trim();
    const cognome = document.getElementById('input-cognome').value.trim();
    const email = document.getElementById('input-email').value.trim();
    const telefono = document.getElementById('input-telefono').value.trim();

    let valid = true;

    // Reset errors
    document.querySelectorAll('.form-input').forEach(input => input.classList.remove('error'));

    if (!nome) {
        document.getElementById('input-nome').classList.add('error');
        valid = false;
    }
    if (!cognome) {
        document.getElementById('input-cognome').classList.add('error');
        valid = false;
    }
    if (!email || !email.includes('@')) {
        document.getElementById('input-email').classList.add('error');
        valid = false;
    }
    if (!telefono || telefono.length < 9) {
        document.getElementById('input-telefono').classList.add('error');
        valid = false;
    }

    if (valid) {
        const titleRadio = document.querySelector('input[name="title"]:checked');
        booking.title = titleRadio ? titleRadio.value : '';
        booking.nome = nome;
        booking.cognome = cognome;
        booking.email = email;
        booking.telefono = telefono;
    }

    return valid;
}

/* --------------------------------------------------------------------------
   Booking Confirmation
   -------------------------------------------------------------------------- */

async function confirmBooking() {
    const btn = document.getElementById('confirm-booking');
    const originalText = btn.textContent;
    btn.textContent = 'Invio in corso...';
    btn.disabled = true;
    BookingAnalytics.track('booking_submitted', `${booking.persons}p_${booking.time}`);

    // Prepara note speciali
    const noteSpeciali = {};
    if (booking.hasDog) noteSpeciali.cane = true;
    if (booking.hasHighchair) noteSpeciali.seggiolone = true;
    if (booking.hasWheelchair) noteSpeciali.accessibilita = true;
    if (booking.email) noteSpeciali.email = booking.email;

    const dataAPI = formatDateLocal(booking.date);

    const payload = {
        nome: booking.nome,
        cognome: booking.cognome,
        telefono: booking.telefono,
        data: dataAPI,
        ora: booking.time,
        persone: booking.persons,
        fonte: 'sito_web',
        note: noteSpeciali
    };

    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/crea`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        if (result.ok) {
            BookingAnalytics.track('booking_success', `${booking.persons}p_${booking.time}`);
            showBookingSuccess();
        } else {
            showError(
                document.querySelector('.summary'),
                result.error || 'Impossibile completare la prenotazione. Riprova o contattaci.',
                () => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            );
        }
    } catch (error) {
        console.error('Errore API:', error);
        showError(
            document.querySelector('.summary'),
            'Errore di connessione. Verifica la tua rete e riprova, oppure <a href="tel:+393408854176" style="color: #e74c3c; text-decoration: underline;">chiamaci</a>.',
            () => {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        );
    }
}

/* --------------------------------------------------------------------------
   Success Screen (Post-Booking)
   -------------------------------------------------------------------------- */

function showBookingSuccess() {
    const confirmedDate = booking.date;
    const confirmedDateFormatted = `${confirmedDate.getDate()} ${months[confirmedDate.getMonth()]} ${confirmedDate.getFullYear()}`;

    const summaryDiv = document.querySelector('.summary');
    summaryDiv.innerHTML = `
        <div class="success-screen">
            <div class="success-checkmark">
                <svg viewBox="0 0 24 24">
                    <polyline points="6 12 10 16 18 8"/>
                </svg>
            </div>
            <h3 class="success-title">Prenotazione Confermata!</h3>
            <p class="success-details">
                Ti aspettiamo il <strong>${confirmedDateFormatted}</strong> alle <strong>${booking.time}</strong><br>
                per <strong>${booking.persons} ${booking.persons === 1 ? 'persona' : 'persone'}</strong>
            </p>
            <p class="success-whatsapp-note">
                Riceverai conferma via email all'indirizzo che hai indicato.<br>
                Per modifiche, contattaci al <a href="tel:+393408854176" style="color: var(--color-bronze);">340 885 4176</a>
            </p>
            <div class="success-actions">
                <button class="btn btn-calendar" id="btn-add-calendar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Aggiungi al Calendario
                </button>
                <a href="index.html" class="btn btn-home">Torna al Sito</a>
            </div>
        </div>
    `;

    // Nascondi il bottone "Modifica" sotto la summary
    const stepNav = document.querySelector('#step-summary .step-nav');
    if (stepNav) stepNav.style.display = 'none';

    // Aggiungi al calendario
    document.getElementById('btn-add-calendar').addEventListener('click', () => addToCalendar());
}

function addToCalendar() {
    const date = booking.date;
    const [hours, minutes] = booking.time.split(':');

    // Crea date start e end (durata 2 ore)
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(hours), parseInt(minutes));
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    // Formatta per iCal
    const pad = (n) => String(n).padStart(2, '0');
    const formatIcal = (d) => `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Antitesi Pizzeria//Prenotazione//IT',
        'BEGIN:VEVENT',
        `DTSTART:${formatIcal(start)}`,
        `DTEND:${formatIcal(end)}`,
        `SUMMARY:Cena da Antitesi Pizzeria`,
        `DESCRIPTION:Prenotazione per ${booking.persons} persone alle ${booking.time}`,
        `LOCATION:Via Remigio Farnetti 21\\, 00044 Frascati (RM)`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'antitesi-prenotazione.ics';
    a.click();
    URL.revokeObjectURL(url);
}

/* --------------------------------------------------------------------------
   Waitlist Modal
   -------------------------------------------------------------------------- */

let waitlistData = { turno: null, turnoLabel: null };

function openWaitlistModal(turno, turnoLabel) {
    waitlistData.turno = turno;
    waitlistData.turnoLabel = turnoLabel;

    document.getElementById('waitlist-date').textContent = booking.dateShort || '-';
    document.getElementById('waitlist-turno').textContent = turnoLabel || '-';
    document.getElementById('waitlist-persons').textContent = booking.persons ? `${booking.persons} persone` : '-';

    // Pre-compila se abbiamo gia' i dati
    if (booking.nome) document.getElementById('waitlist-nome').value = booking.nome;
    if (booking.cognome) document.getElementById('waitlist-cognome').value = booking.cognome;
    if (booking.telefono) document.getElementById('waitlist-telefono').value = booking.telefono;
    if (booking.email) document.getElementById('waitlist-email').value = booking.email;

    document.getElementById('waitlist-modal').classList.add('active');
}

function closeWaitlistModal() {
    document.getElementById('waitlist-modal').classList.remove('active');
}

async function submitWaitlist(e) {
    e.preventDefault();

    const btn = document.getElementById('submit-waitlist');
    const originalText = btn.textContent;
    btn.textContent = 'Invio in corso...';
    btn.disabled = true;

    const nome = document.getElementById('waitlist-nome').value.trim();
    const cognome = document.getElementById('waitlist-cognome').value.trim();
    const telefono = document.getElementById('waitlist-telefono').value.trim();
    const email = document.getElementById('waitlist-email').value.trim();

    if (!nome || !telefono || telefono.length < 9) {
        showError(
            document.querySelector('.waitlist-modal-content'),
            'Inserisci nome e telefono valido.'
        );
        btn.textContent = originalText;
        btn.disabled = false;
        return;
    }

    const payload = {
        data: formatDateEU(booking.date),
        turno: waitlistData.turno,
        nome: nome,
        cognome: cognome,
        telefono: telefono,
        email: email || null,
        persone: booking.persons
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/website/waitlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        if (result.ok) {
            showWaitlistSuccess();
        } else {
            showError(
                document.querySelector('.waitlist-modal-content'),
                result.message || "Impossibile aggiungere alla lista d'attesa."
            );
            btn.textContent = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Errore API waitlist:', error);
        showError(
            document.querySelector('.waitlist-modal-content'),
            'Errore di connessione. Riprova.'
        );
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function showWaitlistSuccess() {
    const modalContent = document.querySelector('.waitlist-modal-content');
    modalContent.innerHTML = `
        <div class="success-screen">
            <div class="success-checkmark">
                <svg viewBox="0 0 24 24">
                    <polyline points="6 12 10 16 18 8"/>
                </svg>
            </div>
            <h3 class="success-title">Sei in Lista d'Attesa!</h3>
            <p class="success-details">
                <strong>${booking.dateShort}</strong> - ${waitlistData.turnoLabel}<br>
                ${booking.persons} persone
            </p>
            <div style="background: rgba(231, 76, 60, 0.1); border: 1px solid rgba(231, 76, 60, 0.3); border-radius: 8px; padding: 1rem; margin: 1.5rem 0;">
                <p style="font-size: 0.85rem; color: #e74c3c; margin: 0; line-height: 1.5;">
                    La richiamata NON è garantita.<br>
                    Verrai contattato solo se si libera un posto.
                </p>
            </div>
            <button onclick="location.reload()" class="btn btn-home" style="border: none; cursor: pointer;">
                Chiudi
            </button>
        </div>
    `;
}

/* --------------------------------------------------------------------------
   Analytics — Booking Funnel Tracking (GA4)
   -------------------------------------------------------------------------- */
const BookingAnalytics = {
    track(action, label) {
        if (typeof gtag === 'function') {
            gtag('event', action, {
                event_category: 'booking',
                event_label: label
            });
        }
    }
};

/* --------------------------------------------------------------------------
   Initialize
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    // Booking gate: prima del 17/02/2026 redirect a telefonata
    if (new Date() < new Date('2026-02-17T00:00:00')) {
        window.location.href = 'tel:+393408854176';
        return;
    }

    stepTabs = document.querySelectorAll('.step-tab');
    stepContents = document.querySelectorAll('.step-content');

    // Month Navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar();
    });

    // Persons Selection (initial, before config loads)
    document.querySelectorAll('.person-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.person-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            booking.persons = parseInt(btn.dataset.persons);
            document.getElementById('to-step-3').disabled = false;
        });
    });

    // Time Selection (initial static, replaced by dynamic later)
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            booking.time = btn.dataset.time;
            document.getElementById('to-step-4').disabled = false;
        });
    });

    // Step Navigation Buttons
    document.getElementById('to-step-2').addEventListener('click', () => goToStep(2));
    document.getElementById('back-to-1').addEventListener('click', () => goToStep(1));
    document.getElementById('to-step-3').addEventListener('click', () => {
        goToStep(3);
        caricaSlotOrari();
        BookingAnalytics.track('booking_step_completed', 'persone');
    });
    document.getElementById('back-to-2').addEventListener('click', () => goToStep(2));
    document.getElementById('to-step-4').addEventListener('click', () => {
        goToStep(4);
        BookingAnalytics.track('booking_step_completed', 'orario');
    });
    document.getElementById('back-to-3').addEventListener('click', () => goToStep(3));
    document.getElementById('to-summary').addEventListener('click', () => {
        if (validateForm()) {
            booking.hasDog = document.getElementById('has-dog').checked;
            booking.hasHighchair = document.getElementById('has-highchair').checked;
            booking.hasWheelchair = document.getElementById('has-wheelchair').checked;
            BookingAnalytics.track('booking_step_completed', 'dati');
            goToStep(5);
        } else {
            BookingAnalytics.track('booking_error', 'validation');
        }
    });
    document.getElementById('back-to-5').addEventListener('click', () => goToStep(4));

    // Form field enable/disable summary button
    const formInputs = ['input-nome', 'input-cognome', 'input-email', 'input-telefono'];
    formInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            const allFilled = formInputs.every(inputId =>
                document.getElementById(inputId).value.trim().length > 0
            );
            document.getElementById('to-summary').disabled = !allFilled;
        });
    });

    // Step tabs click (go back)
    stepTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const stepNum = parseInt(tab.dataset.step);
            if (tab.classList.contains('completed') || tab.classList.contains('active')) {
                goToStep(stepNum);
            }
        });
    });

    // Confirm Booking
    document.getElementById('confirm-booking').addEventListener('click', confirmBooking);

    // Waitlist Modal
    document.getElementById('close-waitlist-modal').addEventListener('click', closeWaitlistModal);
    document.getElementById('waitlist-modal').addEventListener('click', (e) => {
        if (e.target.id === 'waitlist-modal') closeWaitlistModal();
    });
    document.getElementById('waitlist-form').addEventListener('submit', submitWaitlist);

    // Contact panel tracking
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
        link.addEventListener('click', () => BookingAnalytics.track('click_telefono', 'phone'));
    });
    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
        link.addEventListener('click', () => BookingAnalytics.track('click_whatsapp', 'whatsapp'));
    });

    // Start
    renderCalendar();
    caricaConfigurazione();
});
