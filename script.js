/* ==========================================================================
   KASKITA - SMART CLASS TREASURY JAVASCRIPT LOGIC
   ========================================================================== */

// 1. KONSTANTA & INISIALISASI DATA
const STORAGE_KEY = 'kaskita_db_v1';

// Mengambil data dari LocalStorage, jika kosong gunakan data sampel awal
let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
    { id: 1, type: 'masuk', title: 'Saldo Awal Kas Kelas', amount: 50000, date: '15 Okt 2026' },
    { id: 2, type: 'masuk', title: 'Uang Kas - Budi Santoso', amount: 5000, date: '16 Okt 2026' },
    { id: 3, type: 'keluar', title: 'Beli Isi Ulang Spidol Boardmarker', amount: 12000, date: '18 Okt 2026' }
];

// ELEMEN DOM
const txForm = document.getElementById('txForm');
const txList = document.getElementById('txList');
const totalBalance = document.getElementById('totalBalance');
const totalIncome = document.getElementById('totalIncome');
const totalExpense = document.getElementById('totalExpense');
const txCount = document.getElementById('txCount');
const searchInput = document.getElementById('searchInput');
const filterType = document.getElementById('filterType');

// 2. FUNGSI UTILITAS (FORMATTING & SECURITY)

/**
 * Mengubah angka menjadi format mata uang Rupiah (IDR)
 * @param {number} number 
 * @returns {string} Contoh: Rp 50.000
 */
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(number);
}

/**
 * Mencegah serangan Cross-Site Scripting (XSS) pada input teks
 * @param {string} str 
 * @returns {string} Teks terenkapsulasi aman
 */
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 3. FUNGSI RENDER UI & DASHBOARD

/**
 * Merender daftar transaksi dan memperbarui statistik di layar
 */
function renderUI() {
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const filter = filterType ? filterType.value : 'all';
    
    txList.innerHTML = '';

    let income = 0;
    let expense = 0;

    // Hitung Total Seluruh Pemasukan dan Pengeluaran
    transactions.forEach(tx => {
        const amt = parseInt(tx.amount);
        if (tx.type === 'masuk') {
            income += amt;
        } else {
            expense += amt;
        }
    });

    // Filter Data Berdasarkan Pencarian dan Pilihan Kategori
    const filteredTx = transactions.filter(tx => {
        const matchesSearch = tx.title.toLowerCase().includes(query);
        const matchesFilter = filter === 'all' || tx.type === filter;
        return matchesSearch && matchesFilter;
    });

    // Update Counter Jumlah Transaksi
    if (txCount) {
        txCount.innerText = `${filteredTx.length} Transaksi`;
    }

    // Tampilkan State Kosong atau Daftar Transaksi
    if (filteredTx.length === 0) {
        txList.innerHTML = '<div class="empty-state">Belum ada transaksi yang sesuai.</div>';
    } else {
        filteredTx.forEach(tx => {
            const isMasuk = tx.type === 'masuk';
            const item = document.createElement('li');
            item.className = 'tx-item';

            item.innerHTML = `
                <div class="tx-info">
                    <div class="title">${escapeHtml(tx.title)}</div>
                    <div class="date">📅 ${tx.date}</div>
                </div>
                <div class="tx-right">
                    <span class="tx-amount ${tx.type}">
                        ${isMasuk ? '+' : '-'} ${formatRupiah(tx.amount)}
                    </span>
                    <button class="btn-delete" onclick="deleteTx(${tx.id})" title="Hapus Transaksi">🗑️</button>
                </div>
            `;
            txList.appendChild(item);
        });
    }

    // Update Ringkasan Dashboard
    const balance = income - expense;
    if (totalBalance) totalBalance.innerText = formatRupiah(balance);
    if (totalIncome) totalIncome.innerText = formatRupiah(income);
    if (totalExpense) totalExpense.innerText = formatRupiah(expense);

    // Simpan Perubahan ke LocalStorage Browser
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// 4. EEVENT LISTENERS & MANAJEMEN TRANSAKSI

// Form Tambah Transaksi
if (txForm) {
    txForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const type = document.getElementById('txType').value;
        const title = document.getElementById('txTitle').value.trim();
        const amount = parseInt(document.getElementById('txAmount').value);
        
        const today = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        const newTx = {
            id: Date.now(), // Unik ID berbasis timestamp
            type: type,
            title: title,
            amount: amount,
            date: today
        };

        // Masukkan data baru ke urutan paling atas
        transactions.unshift(newTx);
        renderUI();

        // Reset input form
        document.getElementById('txTitle').value = '';
        document.getElementById('txAmount').value = '';
    });
}

/**
 * Menghapus transaksi berdasarkan ID unik
 * @param {number} id 
 */
function deleteTx(id) {
    if (confirm("Apakah Anda yakin ingin menghapus catatan transaksi ini?")) {
        transactions = transactions.filter(tx => tx.id !== id);
        renderUI();
    }
}

// 5. FITUR WHATSAPP INTEGRATION & CADANGAN DATA

/**
 * Menggenerasi teks ringkasan dan membuka WhatsApp API
 */
function shareToWhatsApp() {
    if (transactions.length === 0) {
        alert("Belum ada data transaksi untuk dibagikan!");
        return;
    }

    let income = 0;
    let expense = 0;
    transactions.forEach(tx => {
        if (tx.type === 'masuk') income += parseInt(tx.amount);
        else expense += parseInt(tx.amount);
    });

    const balance = income - expense;

    let text = `*📢 REKAP KAS KELAS (KasKita)*\n`;
    text += `-----------------------------------\n`;
    text += `💰 *Saldo Kas Saat Ini:* ${formatRupiah(balance)}\n`;
    text += `📥 Total Pemasukan: ${formatRupiah(income)}\n`;
    text += `📤 Total Pengeluaran: ${formatRupiah(expense)}\n\n`;
    text += `*3 Transaksi Terakhir:*\n`;

    const recent = transactions.slice(0, 3);
    recent.forEach(tx => {
        const icon = tx.type === 'masuk' ? '🟢' : '🔴';
        text += `${icon} ${tx.title}: ${formatRupiah(tx.amount)}\n`;
    });

    text += `\n_Laporan ini dibuat otomatis via aplikasi KasKita._`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
}

/**
 * Mengekspor data kas saat ini ke file file JSON
 */
function exportData() {
    if (transactions.length === 0) {
        alert("Tidak ada data untuk diunduh!");
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kaskita_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

/**
 * Menghapus seluruh data di browser
 */
function resetData() {
    if (confirm("⚠️ PERINGATAN! Seluruh data kas akan dihapus dari browser ini. Lanjutkan?")) {
        transactions = [];
        renderUI();
    }
}

// 6. INITIALIZATION
// Jalankan render awal saat seluruh skrip berhasil dimuat
document.addEventListener('DOMContentLoaded', function() {
    renderUI();
});
