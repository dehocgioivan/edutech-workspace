import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, child } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDLSzS_RTn-Rb3EUykvvLGHe0qLOS9Yc1k",
  authDomain: "hoctapdoimoi-dhgv.firebaseapp.com",
  projectId: "hoctapdoimoi-dhgv",
  storageBucket: "hoctapdoimoi-dhgv.firebasestorage.app",
  messagingSenderId: "794004432821",
  appId: "1:794004432821:web:69b7fa96d704522e189bfc"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentTeacher = null;

/* =========================================================
   A. ĐĂNG NHẬP GIÁO VIÊN BẰNG GOOGLE
========================================================= */
const btnGoogleLogin = document.getElementById('btnGoogleLogin');
if(btnGoogleLogin) {
  btnGoogleLogin.addEventListener('click', () => {
    signInWithPopup(auth, provider).then((result) => {
      currentTeacher = result.user;
      
      document.getElementById('btnOpenLogin').style.display = 'none';
      document.getElementById('teacherProfile').style.display = 'flex';
      
      // Khớp với ID mới trong index.html
      document.getElementById('teacherNameDisplay').textContent = currentTeacher.displayName;
      document.getElementById('teacherEmailDisplay').textContent = currentTeacher.email;
      if(currentTeacher.photoURL) document.getElementById('teacherAvatar').src = currentTeacher.photoURL;

      // Sinh mã định danh ngắn gọn dựa trên UID
      const autoId = "GV_" + currentTeacher.uid.substring(0, 5).toUpperCase();
      document.getElementById('teacherUniqueId').value = autoId;

      window.closeModals();
      document.querySelector('.hero').style.display = 'none';
      document.querySelector('.app-container').style.display = 'none';
      document.getElementById('teacherDashboard').style.display = 'block';
      
      alert("Đăng nhập thành công! Chào mừng thầy/cô " + currentTeacher.displayName);
    }).catch((error) => {
      alert("Lỗi đăng nhập Google: " + error.message);
    });
  });
}

/* =========================================================
   B. LƯU LỚP HỌC LÊN FIREBASE CLOUD (Ghi đè hàm app.js)
========================================================= */
window.processAndSaveClass = function() {
  if(!currentTeacher) return alert("Vui lòng đăng nhập Google trước khi lưu dữ liệu Lớp học!");

  const isGroupMode = document.querySelector('input[name="deviceMode"]:checked').value === 'group';
  const isDirectMode = document.getElementById('input-direct').style.display === 'block';
  let classData = { members: [], isGroupMode: isGroupMode };

  // Parse dữ liệu từ UI
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

  const teacherId = document.getElementById('teacherUniqueId').value || 'GVDUYEN01';
  classData.createdAt = new Date().toISOString();

  // PUSH LÊN FIREBASE REALTIME DATABASE
  const dbRef = ref(db, `Teachers/${teacherId}/Classes/${classData.className}`);
  set(dbRef, classData).then(() => {
    const yearPrefix = classData.schoolYear.split('-')[0];
    const prefix = `${teacherId}_${classData.className}_${yearPrefix}`; 
    
    let loginInstructions = `✅ ĐÃ LƯU LỚP LÊN CLOUD: ${classData.className}\n\n`;
    if(isGroupMode) {
      loginInstructions += `🔹 Mã Nhóm: ${prefix}_N1, ${prefix}_N2...\n`;
    } else {
      loginInstructions += `🔹 Mã Cá nhân: ${prefix}_NGUYENVANA...\n`;
    }
    alert(loginInstructions);
  }).catch((error) => {
    alert("Lỗi khi lưu lên Firebase: " + error.message);
  });
}

/* =========================================================
   C1. LƯU KỊCH BẢN BÀI GIẢNG (TIMELINE) LÊN CLOUD
========================================================= */
const btnSavePlan = document.querySelector('#tab-plan .btn-submit');
if(btnSavePlan) {
  btnSavePlan.addEventListener('click', () => {
    if(!currentTeacher) return alert("Vui lòng đăng nhập trước!");
    
    const planTitle = document.getElementById('planTitle').value.trim();
    if(!planTitle) return alert("Vui lòng nhập Tiêu đề Giáo án!");
    
    if(window.currentPlan.length === 0) return alert("Kế hoạch đang trống, hãy thêm ít nhất 1 hoạt động từ Kho ứng dụng!");

    const teacherId = document.getElementById('teacherUniqueId').value;
    const planId = "PLAN_" + new Date().getTime(); 

    const planData = {
      title: planTitle,
      steps: window.currentPlan,
      totalSteps: window.currentPlan.length,
      createdAt: new Date().toISOString()
    };

    const dbRef = ref(db, `Teachers/${teacherId}/Plans/${planId}`);
    set(dbRef, planData).then(() => {
      alert("Lưu kịch bản giảng dạy thành công! Đã đồng bộ lên Cloud.");
    }).catch(err => alert("Lỗi lưu trữ: " + err.message));
  });
}

/* =========================================================
   C2. CHƠI ĐỘC LẬP (STANDALONE PLAY) - PHÁT SÓNG GAME
========================================================= */
window.playStandalone = function() {
  if(!currentTeacher) return alert("Vui lòng đăng nhập trước khi chạy Game!");
  
  const gameData = document.getElementById('fcDataInput').value;
  const featureId = window.selectedFeatureForModal.id; // Lấy ID game (vd: f40)
  const teacherId = document.getElementById('teacherUniqueId').value;
  
  window.closeModals();
  alert(`🔥 ĐÃ PHÁT SÓNG CHẾ ĐỘ ĐỘC LẬP: ${window.selectedFeatureForModal.name}\nHọc sinh có thể tham gia bằng ID mạng lưới của bạn!`);
  
  // Ghi đè vào node ActiveSessions để kích hoạt phiên học
  set(ref(db, `ActiveSessions/${teacherId}`), {
     mode: 'standalone',
     activeFeature: featureId,
     gameData: gameData, // Nội dung TXT câu hỏi/cấu hình
     timestamp: new Date().getTime()
  }).then(() => {
      // (Tính năng nâng cao: Có thể mở Màn hình điều khiển của Giáo viên ở Tab mới tại đây)
      // window.open(`./apps/${featureId}/teacher.html?teacher=${teacherId}`, '_blank');
      console.log("Đã phát sóng Session lên Serverless!");
  }).catch(err => alert("Lỗi mạng: " + err.message));
}

/* =========================================================
   D. HỌC SINH JOIN LỚP (ROUTING THÔNG MINH)
========================================================= */
const btnJoinClass = document.getElementById('btnJoinClass');
if(btnJoinClass) {
  btnJoinClass.addEventListener('click', () => {
    const studentFullId = document.getElementById('studentGroupId').value.trim().toUpperCase();
    const pins = Array.from(document.querySelectorAll('.pin-box')).map(i => i.value).join('');
    
    if(!studentFullId || pins.length < 4) return alert("Vui lòng nhập đủ ID và 4 số PIN!");

    // Tách ID (Quy tắc định dạng mới VD: GVDUYEN01_10A6_2026_N1)
    const parts = studentFullId.split('_');
    const teacherId = parts[0];
    
    if(!teacherId || parts.length < 3) return alert("Mã định danh không hợp lệ. Hãy kiểm tra lại theo form Hướng dẫn!");

    const studentId = studentFullId.replace(teacherId + '_', ''); // Kết quả: 10A6_2026_N1

    alert(`Đang kết nối vào phòng học của GV: ${teacherId}...`);
    
    // Đọc trạng thái phòng học Realtime
    const sessionRef = ref(db, `ActiveSessions/${teacherId}`);
    get(sessionRef).then((snapshot) => {
      const data = snapshot.val();
      
      if(data && data.activeFeature) {
         // Lệnh chuyển hướng (Redirect) học sinh thẳng vào file App tương ứng của tính năng đó
         // Ví dụ: activeFeature = 'f40' -> mở f40-quiz/index.html
         const gameUrl = `./apps/${data.activeFeature}-quiz/index.html?teacher=${teacherId}&student=${studentId}`;
         window.location.href = gameUrl;
      } else {
         alert("Giáo viên chưa mở phiên học nào. Vui lòng chờ!");
      }
    }).catch((err) => {
       alert("Lỗi kết nối Serverless: " + err.message);
    });
  });
}
