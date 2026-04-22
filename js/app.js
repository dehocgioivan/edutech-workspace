/* =========================================================
   1. LOGIC ĐIỀU KHIỂN GIAO DIỆN (UI)
========================================================= */

// Hàm mở/đóng Modal
window.openModal = function(id) {
  document.getElementById(id).classList.add('active');
}
window.closeModals = function() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.remove('active');
  });
}
window.switchAuthTab = function(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  if(tab === 'login') {
    document.querySelectorAll('.auth-tab')[0].classList.add('active');
    document.getElementById('formLogin').classList.add('active');
  } else {
    document.querySelectorAll('.auth-tab')[1].classList.add('active');
    document.getElementById('formRegister').classList.add('active');
  }
}

// Hàm chuyển Tab trong Dashboard của Giáo viên
window.switchTab = function(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
  
  document.getElementById(tabId).classList.add('active');
  event.currentTarget.classList.add('active');
}

// Ràng buộc nhập ID Giáo viên
window.updateTeacherId = function() {
  const input = document.getElementById('teacherUniqueId');
  let val = input.value.trim().toUpperCase();
  if(!val.startsWith('GV')) {
    alert("Mã định danh phải bắt đầu bằng 'GV' (Ví dụ: GVDUYEN01)");
    input.value = 'GV' + val.replace(/^GV/, '');
    return;
  }
  alert("Cập nhật mã định danh thành công: " + val);
}

/* =========================================================
   2. LOGIC QUẢN LÝ LỚP HỌC (IMPORT/EXPORT TXT)
========================================================= */

window.handleFileImport = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('classDataEditor').value = e.target.result;
    alert("Đã load dữ liệu từ file TXT! Bạn có thể xem và chỉnh sửa trực tiếp bên dưới.");
  };
  reader.readAsText(file);
}

window.exportToTXT = function() {
  let content = document.getElementById('classDataEditor').value;
  if (!content.trim()) {
    content = "[LOP]: 10A1\n[NAMHOC]: 2026-2027\n[NHOM]: 6\n[SISO]: 32\n[THANHVIEN]:\n1. Nguyễn Văn A [NHOM 1]\n2. Nguyễn Văn B [NHOM 2]\n3. Trần Văn C [NHOM 1]";
    document.getElementById('classDataEditor').value = content;
  }

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "MauThongTinLop.txt";
  a.click();
  URL.revokeObjectURL(url);
}

/* =========================================================
   3. LOGIC KỊCH BẢN BÀI GIẢNG & AI THỜI LƯỢNG
========================================================= */

const eduFeatures = [
  { id: 'f01', category: 'Quản lý Lớp', name: 'Điểm danh Khuôn mặt AI (FaceID)', baseTime: 3 },
  { id: 'f02', category: 'Quản lý Lớp', name: 'Điểm danh Thủ công (Tích chọn)', baseTime: 5 },
  { id: 'f03', category: 'Quản lý Lớp', name: 'Kiểm tra tiếng ồn Lớp học', baseTime: 0 },
  { id: 'f04', category: 'Khởi động', name: 'Random khuôn mặt trả bài cũ', baseTime: 7 },
  { id: 'f05', category: 'Khởi động', name: 'Bốc thăm ngẫu nhiên (Vòng quay)', baseTime: 5 },
  { id: 'f06', category: 'Khởi động', name: 'Sóng não Cảm xúc (Mood Tracker)', baseTime: 2 },
  { id: 'f07', category: 'Trình bày', name: 'Bảng trắng Chung Realtime', baseTime: 15 },
  { id: 'f08', category: 'Trình bày', name: 'Thực tế ảo 3D (WebAR)', baseTime: 10 },
  { id: 'f09', category: 'Trình bày', name: 'Auto Mindmap (Sơ đồ tư duy)', baseTime: 10 },
  { id: 'f10', category: 'Tương tác', name: 'Hộp đen Hỏi đáp (Ẩn danh)', baseTime: 10 },
  { id: 'f11', category: 'Tương tác', name: 'Bỏ phiếu nhanh (Live Polling)', baseTime: 3 },
  { id: 'f12', category: 'Tương tác', name: 'Thảo luận nhóm (Breakout Rooms)', baseTime: 15 },
  { id: 'f13', category: 'Trò chơi', name: 'Đấu trường Tri thức (1 vs 1)', baseTime: 10 },
  { id: 'f14', category: 'Trò chơi', name: 'Đấu trường Tri thức (Nhóm vs Nhóm)', baseTime: 15 },
  { id: 'f15', category: 'Trò chơi', name: 'Sinh tồn Lớp học (Battle Royale)', baseTime: 15 },
  { id: 'f16', category: 'Trò chơi', name: 'Chinh phục Đỉnh cao (Boss Raid)', baseTime: 20 },
  { id: 'f17', category: 'Trò chơi', name: 'Kéo co Trí tuệ', baseTime: 10 },
  { id: 'f18', category: 'Trò chơi', name: 'Cuộc đua Kỳ thú', baseTime: 15 },
  { id: 'f19', category: 'Trò chơi', name: 'Ghép cặp Flashcard Siêu tốc', baseTime: 5 },
  { id: 'f20', category: 'Trò chơi', name: 'Giải mã Mật thư (Escape Room)', baseTime: 25 },
  { id: 'f21', category: 'Trò chơi', name: 'Tranh biện (Debate Mode)', baseTime: 20 },
  { id: 'f22', category: 'Kiểm tra', name: 'Chấm điểm Chéo (Peer Review)', baseTime: 15 },
  { id: 'f23', category: 'Kiểm tra', name: 'Bài Test Trắc nghiệm Tốc độ', baseTime: 15 },
  { id: 'f24', category: 'Kiểm tra', name: 'Bài Test Tự luận (AI chấm điểm)', baseTime: 25 },
  { id: 'f25', category: 'Thực hành', name: 'Tập Thuyết trình (AI phân tích)', baseTime: 20 },
  { id: 'f26', category: 'Thực hành', name: 'Phòng Thí nghiệm ảo Sandbox', baseTime: 15 },
  { id: 'f27', category: 'Công cụ Nền', name: 'Phân tích Mức độ Tập trung AI', baseTime: 0 },
  { id: 'f28', category: 'Công cụ Nền', name: 'Ghi Log Hoạt động học tập', baseTime: 0 },
  { id: 'f29', category: 'Công cụ Nền', name: 'Trợ giảng Ảo (Chatbot 24/7)', baseTime: 0 },
  { id: 'f30', category: 'Công cụ Nền', name: 'Phát Huy hiệu (Badge) Tự động', baseTime: 2 },
  { id: 'f31', category: 'Công cụ Nền', name: 'Tự động Tóm tắt bài học (Text-to-Speech)', baseTime: 5 }
];

window.currentPlan = []; // Phải gán vào window để file firebase.js lấy được

function initFeatureDropdown() {
  const select = document.getElementById('featureSelect');
  if(!select) return;
  
  select.innerHTML = '<option value="">-- Chọn tính năng / Trò chơi --</option>';
  
  const categories = [...new Set(eduFeatures.map(f => f.category))];
  categories.forEach(cat => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = `--- ${cat.toUpperCase()} ---`;
    
    eduFeatures.filter(f => f.category === cat).forEach(f => {
      const option = document.createElement('option');
      option.value = f.id;
      const timeLabel = f.baseTime > 0 ? `~${f.baseTime} phút` : 'Chạy ngầm';
      option.textContent = `${f.name} (${timeLabel})`;
      optgroup.appendChild(option);
    });
    select.appendChild(optgroup);
  });
}

window.addFeatureToPlan = function() {
  const select = document.getElementById('featureSelect');
  const featureId = select.value;
  if(!featureId) return alert("Vui lòng chọn một tính năng để thêm!");

  const feature = eduFeatures.find(f => f.id === featureId);
  window.currentPlan.push({...feature, customTime: feature.baseTime}); 
  
  renderTimeline();
  calculateAITime();
  
  select.value = "";
}

window.removeFeatureFromPlan = function(index) {
  window.currentPlan.splice(index, 1);
  renderTimeline();
  calculateAITime();
}

window.updateTime = function(index, newTime) {
  window.currentPlan[index].customTime = parseInt(newTime) || 0;
  calculateAITime();
}

function renderTimeline() {
  const container = document.getElementById('timelineBuilder');
  container.innerHTML = '';

  if(window.currentPlan.length === 0) {
    container.innerHTML = "<div style='color: var(--text-muted); font-style: italic; font-size: 14px;'>Chưa có tính năng nào trong kế hoạch. Hãy chọn và thêm ở phía dưới.</div>";
    return;
  }

  window.currentPlan.forEach((item, index) => {
    const div = document.createElement('div');
    div.style.cssText = `
      position: relative;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--card-border);
      padding: 12px 15px;
      border-radius: 12px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s;
    `;
    div.onmouseover = () => { div.style.borderColor = 'var(--primary-cyan)'; div.style.background = 'rgba(0, 240, 255, 0.05)'; };
    div.onmouseout = () => { div.style.borderColor = 'var(--card-border)'; div.style.background = 'rgba(255,255,255,0.03)'; };
    
    div.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px;">
        <span style="background: linear-gradient(45deg, var(--primary-purple), var(--primary-cyan)); color: #fff; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; box-shadow: 0 0 10px rgba(138, 43, 226, 0.5);">${index + 1}</span>
        <div>
          <strong style="color: #fff; font-size: 15px; display: block; margin-bottom: 2px;">${item.name}</strong>
          <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 5px;">
            <i class="fa-regular fa-clock"></i> Thời lượng ấn định: 
            <input type="number" value="${item.customTime}" min="0" onchange="updateTime(${index}, this.value)" style="width: 50px; background: rgba(0,0,0,0.3); border: 1px solid var(--card-border); color: var(--primary-cyan); text-align: center; border-radius: 6px; padding: 2px; font-weight: bold;"> phút
          </div>
        </div>
      </div>
      <button onclick="removeFeatureFromPlan(${index})" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: var(--danger); width: 35px; height: 35px; border-radius: 8px; cursor: pointer; transition: 0.3s;"><i class="fa-solid fa-trash-can"></i></button>
    `;
    
    const dot = document.createElement('div');
    dot.style.cssText = `position: absolute; left: -31px; top: 20px; width: 12px; height: 12px; background: var(--primary-cyan); border-radius: 50%; box-shadow: 0 0 8px var(--primary-cyan);`;
    div.appendChild(dot);

    container.appendChild(div);
  });
}

function calculateAITime() {
  const total = window.currentPlan.reduce((sum, item) => sum + item.customTime, 0);
  const textElem = document.getElementById('aiTimeEstimate');
  const container = textElem.parentElement.parentElement;
  const icon = container.querySelector('i.fa-robot');

  if(total === 0) {
    textElem.textContent = "0 phút";
    textElem.style.color = "var(--text-muted)";
    container.style.borderColor = "var(--card-border)";
    container.style.background = "rgba(255,255,255,0.03)";
    icon.style.color = "var(--text-muted)";
  }
  else if(total <= 45) {
    textElem.textContent = `${total} phút (Hoàn hảo cho 1 tiết học)`;
    textElem.style.color = "var(--success)";
    container.style.borderColor = "rgba(16, 185, 129, 0.3)";
    container.style.background = "rgba(16, 185, 129, 0.05)";
    icon.style.color = "var(--success)";
  } 
  else if(total <= 90) {
    textElem.textContent = `${total} phút (Cần 2 tiết học liền kề)`;
    textElem.style.color = "#eab308";
    container.style.borderColor = "rgba(234, 179, 8, 0.3)";
    container.style.background = "rgba(234, 179, 8, 0.05)";
    icon.style.color = "#eab308";
  } 
  else {
    textElem.textContent = `${total} phút (Cảnh báo: Nguy cơ cháy giáo án!)`;
    textElem.style.color = "var(--danger)";
    container.style.borderColor = "rgba(239, 68, 68, 0.3)";
    container.style.background = "rgba(239, 68, 68, 0.05)";
    icon.style.color = "var(--danger)";
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initFeatureDropdown();
  
  const pinInputs = document.querySelectorAll('.pin-box');
  pinInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      if(e.target.value && index < pinInputs.length - 1) {
        pinInputs[index + 1].focus();
      }
    });
  });
});
