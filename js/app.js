/* =========================================================
   1. LOGIC ĐIỀU KHIỂN GIAO DIỆN (UI) CHUNG
========================================================= */

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

window.switchTab = function(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
  
  document.getElementById(tabId).classList.add('active');
  event.currentTarget.classList.add('active');
}

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

window.toggleInputMode = function(mode) {
  document.querySelectorAll('.inner-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('input-direct').style.display = 'none';
  document.getElementById('input-txt').style.display = 'none';
  
  if(mode === 'direct') {
    document.querySelectorAll('.inner-tab')[0].classList.add('active');
    document.getElementById('input-direct').style.display = 'block';
  } else {
    document.querySelectorAll('.inner-tab')[1].classList.add('active');
    document.getElementById('input-txt').style.display = 'block';
  }
}

/* =========================================================
   2. LOGIC QUẢN LÝ LỚP HỌC (NHẬP FORM / PARSE TXT MỚI)
========================================================= */

window.downloadClassTemplate = function() {
  const content = "[LOP]: 10A6\n[NAMHOC]: 2026-2027\n[SISO]: 32\n[SONHOM]: 6\n[THANHVIEN]:\n{\nNguyễn Văn A - NHOM1\nNguyễn Văn B - NHOM2\nNguyễn Văn C - NHOM3\n}";
  downloadFile("MauLopHoc.txt", content);
}

window.processAndSaveClass = function() {
  const isGroupMode = document.querySelector('input[name="deviceMode"]:checked').value === 'group';
  const isDirectMode = document.getElementById('input-direct').style.display === 'block';
  let classData = { members: [], isGroupMode: isGroupMode };

  // Parse dữ liệu tùy theo chế độ
  if (isDirectMode) {
    classData.className = document.getElementById('dirClass').value.trim().toUpperCase();
    classData.schoolYear = document.getElementById('dirYear').value.trim();
    classData.totalStudents = parseInt(document.getElementById('dirTotal').value) || 0;
    classData.totalGroups = parseInt(document.getElementById('dirGroups').value) || 0;
    
    const lines = document.getElementById('dirMembers').value.split('\n');
    lines.forEach(line => {
      if(line.includes('-')) {
        const parts = line.split('-');
        classData.members.push({ name: parts[0].trim(), group: parts[1].trim() });
      }
    });
  } else {
    const text = document.getElementById('txtClassEditor').value;
    try {
      classData.className = text.match(/\[LOP\]:\s*(.*)/i)[1].trim().toUpperCase();
      classData.schoolYear = text.match(/\[NAMHOC\]:\s*(.*)/i)[1].trim();
      classData.totalStudents = parseInt(text.match(/\[SISO\]:\s*(\d+)/i)[1]);
      classData.totalGroups = parseInt(text.match(/\[SONHOM\]:\s*(\d+)/i)[1]);
      
      const memberBlock = text.match(/\[THANHVIEN\]:\s*\{([\s\S]*?)\}/i)[1];
      memberBlock.split('\n').forEach(line => {
        if(line.includes('-')) {
          const parts = line.split('-');
          classData.members.push({ name: parts[0].trim(), group: parts[1].trim() });
        }
      });
    } catch(err) {
      return alert("Cú pháp TXT không hợp lệ! Hãy đảm bảo đúng mẫu cấu trúc ngoặc { } và dấu gạch ngang.");
    }
  }

  if(!classData.className || classData.members.length === 0) {
    return alert("Thiếu thông tin Mã lớp hoặc Danh sách thành viên!");
  }

  // Sinh ID Đăng nhập hướng dẫn cho Giáo viên
  const teacherId = document.getElementById('teacherUniqueId').value || 'GVDUYEN01';
  const yearPrefix = classData.schoolYear.split('-')[0]; // Lấy năm đầu tiên
  const prefix = `${teacherId}_${classData.className}_${yearPrefix}`; 
  
  let loginInstructions = `✅ XỬ LÝ LỚP THÀNH CÔNG: ${classData.className} (${classData.members.length} HS / ${classData.totalGroups} Nhóm)\n\n`;
  loginInstructions += `HƯỚNG DẪN MÃ ĐĂNG NHẬP CHO HỌC SINH:\n`;
  
  if(isGroupMode) {
    loginInstructions += `🔹 Thiết lập: Đăng nhập theo NHÓM\n`;
    loginInstructions += `🔹 Cấu trúc ID Nhóm:\n   ${prefix}_N1\n   ${prefix}_N2\n   ...\n`;
  } else {
    loginInstructions += `🔹 Thiết lập: Đăng nhập CÁ NHÂN\n`;
    loginInstructions += `🔹 Cấu trúc ID Cá nhân (Viết liền không dấu):\n   ${prefix}_NGUYENVANA\n   ${prefix}_LETHIB\n   ...\n`;
  }
  loginInstructions += `\nMật khẩu (Mã PIN): Tùy chỉnh theo từng Phiên học do bạn tạo ra.`;

  console.log("JSON Lớp Học (Sẵn sàng đưa lên DB):", classData);
  alert(loginInstructions);
  
  // Ở đây sau này sẽ gọi hàm đẩy classData lên Firebase do firebase.js quản lý
}

function downloadFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

/* =========================================================
   3. HỆ SINH THÁI 56 TÍNH NĂNG & TRÒ CHƠI
========================================================= */

const eduFeatures = [
  // Nhóm 1: Quản lý Lớp (Class Management)
  { id: 'f01', category: 'Quản lý', name: 'Điểm danh FaceID AI', baseTime: 3 },
  { id: 'f02', category: 'Quản lý', name: 'Điểm danh Thủ công (Tích chọn)', baseTime: 5 },
  { id: 'f03', category: 'Quản lý', name: 'Radar Tiếng ồn Lớp học', baseTime: 0 },
  { id: 'f04', category: 'Quản lý', name: 'Báo cáo vắng mặt tự động', baseTime: 2 },
  { id: 'f05', category: 'Quản lý', name: 'Xếp chỗ ngồi ngẫu nhiên', baseTime: 2 },
  
  // Nhóm 2: Khởi động (Warm-up)
  { id: 'f06', category: 'Khởi động', name: 'Random khuôn mặt trả bài', baseTime: 5 },
  { id: 'f07', category: 'Khởi động', name: 'Vòng quay may mắn', baseTime: 5 },
  { id: 'f08', category: 'Khởi động', name: 'Mood Tracker (Sóng não)', baseTime: 2 },
  { id: 'f09', category: 'Khởi động', name: 'Bốc thăm chia nhóm', baseTime: 3 },
  { id: 'f10', category: 'Khởi động', name: 'Timer Đếm ngược 3D', baseTime: 0 },
  { id: 'f11', category: 'Khởi động', name: 'Âm nhạc tạo Mood', baseTime: 0 },

  // Nhóm 3: Trình bày (Presentation)
  { id: 'f12', category: 'Trình bày', name: 'Bảng trắng Chung Realtime', baseTime: 15 },
  { id: 'f13', category: 'Trình bày', name: 'Thực tế ảo 3D (WebAR)', baseTime: 10 },
  { id: 'f14', category: 'Trình bày', name: 'Auto Mindmap (Sơ đồ tư duy)', baseTime: 10 },
  { id: 'f15', category: 'Trình bày', name: 'Trình chiếu File (PDF/Slide)', baseTime: 20 },
  { id: 'f16', category: 'Trình bày', name: 'Ghi chú Đồng tác giả', baseTime: 15 },
  { id: 'f17', category: 'Trình bày', name: 'Co-browsing (Duyệt web chung)', baseTime: 10 },

  // Nhóm 4: Tương tác (Interaction)
  { id: 'f18', category: 'Tương tác', name: 'Hộp đen Hỏi đáp (Ẩn danh)', baseTime: 10 },
  { id: 'f19', category: 'Tương tác', name: 'Bỏ phiếu nhanh (Live Polling)', baseTime: 5 },
  { id: 'f20', category: 'Tương tác', name: 'Breakout Rooms (Phòng nhỏ)', baseTime: 15 },
  { id: 'f21', category: 'Tương tác', name: 'Bắn Tim / Reaction thả ga', baseTime: 0 },
  { id: 'f22', category: 'Tương tác', name: 'Giơ tay Phát biểu', baseTime: 0 },
  { id: 'f23', category: 'Tương tác', name: 'Bảng vàng Xếp hạng (Live)', baseTime: 3 },

  // Nhóm 5: Gamification (Trò chơi Đỉnh cao)
  { id: 'f24', category: 'Trò chơi', name: 'Đấu trường Tri thức (1 vs 1)', baseTime: 10 },
  { id: 'f25', category: 'Trò chơi', name: 'Đấu trường Tri thức (Nhóm)', baseTime: 15 },
  { id: 'f26', category: 'Trò chơi', name: 'Sinh tồn Lớp học (Battle Royale)', baseTime: 20 },
  { id: 'f27', category: 'Trò chơi', name: 'Chinh phục Đỉnh cao (Boss Raid)', baseTime: 25 },
  { id: 'f28', category: 'Trò chơi', name: 'Kéo co Trí tuệ', baseTime: 10 },
  { id: 'f29', category: 'Trò chơi', name: 'Cuộc đua Kỳ thú', baseTime: 15 },
  { id: 'f30', category: 'Trò chơi', name: 'Ghép cặp Flashcard Siêu tốc', baseTime: 8 },
  { id: 'f31', category: 'Trò chơi', name: 'Giải mã Mật thư (Escape Room)', baseTime: 30 },
  { id: 'f32', category: 'Trò chơi', name: 'Sân khấu Tranh biện (Debate)', baseTime: 25 },
  { id: 'f33', category: 'Trò chơi', name: 'Giải mã Ô chữ (Crossword)', baseTime: 15 },
  { id: 'f34', category: 'Trò chơi', name: 'Bingo Học thuật', baseTime: 10 },
  { id: 'f35', category: 'Trò chơi', name: 'Ai là Triệu phú', baseTime: 15 },
  { id: 'f36', category: 'Trò chơi', name: 'Săn tìm Kho báu (Scavenger)', baseTime: 20 },
  { id: 'f37', category: 'Trò chơi', name: 'Xếp hạng Thẻ bài', baseTime: 10 },
  { id: 'f38', category: 'Trò chơi', name: 'Đuổi hình Bắt chữ', baseTime: 10 },

  // Nhóm 6: Kiểm tra & Đánh giá (Assessment)
  { id: 'f39', category: 'Kiểm tra', name: 'Chấm điểm Chéo (Peer Review)', baseTime: 15 },
  { id: 'f40', category: 'Kiểm tra', name: 'Bài Test Trắc nghiệm Tốc độ', baseTime: 15 },
  { id: 'f41', category: 'Kiểm tra', name: 'Bài Test Tự luận (AI chấm)', baseTime: 25 },
  { id: 'f42', category: 'Kiểm tra', name: 'Điền vào Chỗ trống', baseTime: 10 },
  { id: 'f43', category: 'Kiểm tra', name: 'Bài tập Nối từ / Nối ý', baseTime: 10 },
  { id: 'f44', category: 'Kiểm tra', name: 'Vẽ Sơ đồ chấm điểm', baseTime: 15 },
  { id: 'f45', category: 'Kiểm tra', name: 'Viết Luận Nhóm (Co-writing)', baseTime: 25 },

  // Nhóm 7: Thực hành (Practice)
  { id: 'f46', category: 'Thực hành', name: 'Tập Thuyết trình (AI nghe)', baseTime: 20 },
  { id: 'f47', category: 'Thực hành', name: 'Sandbox Lab (Thí nghiệm ảo)', baseTime: 20 },
  { id: 'f48', category: 'Thực hành', name: 'Nhập vai (Roleplay Scenarios)', baseTime: 25 },
  { id: 'f49', category: 'Thực hành', name: 'IDE Code chung (Tin học)', baseTime: 25 },

  // Nhóm 8: Công cụ Nền & AI Tool (Chạy ngầm)
  { id: 'f50', category: 'Công cụ Nền', name: 'AI Phân tích Tập trung', baseTime: 0 },
  { id: 'f51', category: 'Công cụ Nền', name: 'Ghi Log Hoạt động học tập', baseTime: 0 },
  { id: 'f52', category: 'Công cụ Nền', name: 'Trợ giảng Ảo (Chatbot 24/7)', baseTime: 0 },
  { id: 'f53', category: 'Công cụ Nền', name: 'Tự động Phát Huy hiệu (Badge)', baseTime: 0 },
  { id: 'f54', category: 'Công cụ Nền', name: 'TTS Tóm tắt bài (Đọc văn bản)', baseTime: 5 },
  { id: 'f55', category: 'Công cụ Nền', name: 'Phân tích Cảm xúc Văn bản', baseTime: 0 },
  { id: 'f56', category: 'Công cụ Nền', name: 'Tự động Dịch thuật', baseTime: 0 }
];

window.currentPlan = [];

/* =========================================================
   4. RENDER THƯ VIỆN & QUẢN LÝ KỊCH BẢN
========================================================= */

function renderFeatureLibrary() {
  const grid = document.getElementById('featureLibraryGrid');
  if(!grid) return;
  grid.innerHTML = '';

  eduFeatures.forEach(feature => {
    const card = document.createElement('div');
    card.className = 'grid-card';
    card.onclick = () => openFeatureConfig(feature);
    
    // Gán Icon và màu sắc dựa trên Category
    let icon = 'fa-microchip'; let color = 'c-cyan';
    if(feature.category === 'Trò chơi') { icon = 'fa-gamepad'; color = 'c-orange'; }
    else if(feature.category === 'Kiểm tra') { icon = 'fa-pen-to-square'; color = 'c-purple'; }
    else if(feature.category === 'Khởi động') { icon = 'fa-bolt'; color = 'c-green'; }
    else if(feature.category === 'Tương tác') { icon = 'fa-comments'; color = 'c-cyan'; }
    else if(feature.category === 'Công cụ Nền') { icon = 'fa-robot'; color = 'c-purple'; }

    card.innerHTML = `
      <div class="icon-box"><i class="fa-solid ${icon} ${color}"></i></div>
      <h3 class="card-title">${feature.name}</h3>
      <p class="card-desc" style="font-size:12px;">Nhóm: ${feature.category} | Thời gian: ${feature.baseTime > 0 ? '~' + feature.baseTime + 'p' : 'Chạy ngầm'}</p>
    `;
    grid.appendChild(card);
  });
}

let selectedFeatureForModal = null;

window.openFeatureConfig = function(feature) {
  selectedFeatureForModal = feature;
  document.getElementById('fcTitle').textContent = feature.name;
  
  let desc = `Thời lượng dự kiến: ${feature.baseTime > 0 ? feature.baseTime + ' phút' : 'Chạy ngầm liên tục'}. `;
  let showDataSection = false;

  // Nếu là Trò chơi hoặc Kiểm tra, yêu cầu nhập liệu từ form TXT
  if(feature.category === 'Trò chơi' || feature.category === 'Kiểm tra') {
    desc += "Cần nạp dữ liệu câu hỏi. Nhập trực tiếp hoặc tải form TXT mẫu bên dưới.";
    showDataSection = true;
  } else {
    desc += "Tính năng này tự động chạy, không cần thiết lập thêm dữ liệu.";
  }

  document.getElementById('fcDesc').textContent = desc;
  document.getElementById('fcDataSection').style.display = showDataSection ? 'block' : 'none';
  document.getElementById('fcDataInput').value = '';

  openModal('featureConfigModal');
}

window.downloadGameTemplate = function() {
  const content = "[CAUHOI]: Ai là tác giả Truyện Kiều?\n[DAPAN]: Nguyễn Du, Nguyễn Trãi, Hồ Xuân Hương\n[DUNG]: 1\n---\n[CAUHOI]: ...";
  downloadFile("MauCauHoi.txt", content);
}

window.addToPlan = function() {
  const gameData = document.getElementById('fcDataInput').value;
  // Đẩy vào mảng kế hoạch chung
  window.currentPlan.push({
    ...selectedFeatureForModal, 
    customTime: selectedFeatureForModal.baseTime,
    data: gameData // Dữ liệu form kèm theo
  });
  
  renderTimeline();
  closeModals();
  alert(`Đã thêm [${selectedFeatureForModal.name}] vào Kế hoạch!`);
}

window.playStandalone = function() {
  const gameData = document.getElementById('fcDataInput').value;
  closeModals();
  // Bỏ qua Kế hoạch, kích hoạt lệnh chạy ngay lập tức
  alert(`🔥 KHỞI ĐỘNG ĐỘC LẬP: ${selectedFeatureForModal.name}...\nHọc sinh có thể tham gia ngay bây giờ!`);
  // (Tại đây sẽ gọi lệnh set() Firebase đẩy gameData vào node ActiveSession)
}

function renderTimeline() {
  const container = document.getElementById('timelineBuilder');
  container.innerHTML = '';

  if(window.currentPlan.length === 0) {
    container.innerHTML = "<div style='color: var(--text-muted); font-style: italic; font-size: 14px;'>Chưa có tính năng nào trong kế hoạch. Hãy chọn từ Thư viện bên dưới.</div>";
    return;
  }

  window.currentPlan.forEach((item, index) => {
    const div = document.createElement('div');
    div.style.cssText = `
      position: relative; background: rgba(255,255,255,0.03); border: 1px solid var(--card-border);
      padding: 12px 15px; border-radius: 12px; margin-bottom: 12px;
      display: flex; justify-content: space-between; align-items: center; transition: all 0.3s;
    `;
    div.onmouseover = () => { div.style.borderColor = 'var(--primary-cyan)'; div.style.background = 'rgba(0, 240, 255, 0.05)'; };
    div.onmouseout = () => { div.style.borderColor = 'var(--card-border)'; div.style.background = 'rgba(255,255,255,0.03)'; };
    
    // Icon data nếu có nạp dữ liệu
    const dataIcon = item.data ? `<i class="fa-solid fa-database" style="color:var(--success); font-size:10px; margin-left:5px;" title="Đã nạp dữ liệu"></i>` : '';

    div.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px;">
        <span style="background: linear-gradient(45deg, var(--primary-purple), var(--primary-cyan)); color: #fff; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; box-shadow: 0 0 10px rgba(138, 43, 226, 0.5);">${index + 1}</span>
        <div>
          <strong style="color: #fff; font-size: 15px; display: block; margin-bottom: 2px;">${item.name} ${dataIcon}</strong>
          <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 5px;">
            <i class="fa-regular fa-clock"></i> Thời lượng: 
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

window.removeFeatureFromPlan = function(index) {
  window.currentPlan.splice(index, 1);
  renderTimeline();
  calculateAITime();
}

window.updateTime = function(index, newTime) {
  window.currentPlan[index].customTime = parseInt(newTime) || 0;
  calculateAITime();
}

function calculateAITime() {
  const total = window.currentPlan.reduce((sum, item) => sum + item.customTime, 0);
  const textElem = document.getElementById('aiTimeEstimate');
  const container = textElem.parentElement.parentElement;
  const icon = container.querySelector('i.fa-robot');

  if(total === 0) {
    textElem.textContent = "0 phút"; textElem.style.color = "var(--text-muted)";
    container.style.borderColor = "var(--card-border)"; container.style.background = "rgba(255,255,255,0.03)";
    icon.style.color = "var(--text-muted)";
  }
  else if(total <= 45) {
    textElem.textContent = `${total} phút (Hoàn hảo 1 tiết)`; textElem.style.color = "var(--success)";
    container.style.borderColor = "rgba(16, 185, 129, 0.3)"; container.style.background = "rgba(16, 185, 129, 0.05)";
    icon.style.color = "var(--success)";
  } 
  else if(total <= 90) {
    textElem.textContent = `${total} phút (Cần 2 tiết)`; textElem.style.color = "#eab308";
    container.style.borderColor = "rgba(234, 179, 8, 0.3)"; container.style.background = "rgba(234, 179, 8, 0.05)";
    icon.style.color = "#eab308";
  } 
  else {
    textElem.textContent = `${total} phút (Nguy cơ cháy giáo án!)`; textElem.style.color = "var(--danger)";
    container.style.borderColor = "rgba(239, 68, 68, 0.3)"; container.style.background = "rgba(239, 68, 68, 0.05)";
    icon.style.color = "var(--danger)";
  }
}

/* =========================================================
   5. KHỞI TẠO EVENT LẮNG NGHE
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  renderFeatureLibrary();
  
  // Tự động nhảy ô cho Form Mật khẩu PIN 4 số
  const pinInputs = document.querySelectorAll('.pin-box');
  pinInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      if(e.target.value && index < pinInputs.length - 1) {
        pinInputs[index + 1].focus();
      }
    });
  });
});
