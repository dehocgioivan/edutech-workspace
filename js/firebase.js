import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, child } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

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

/* A. ĐĂNG NHẬP GIÁO VIÊN */
const btnGoogleLogin = document.getElementById('btnGoogleLogin');
if(btnGoogleLogin) {
  btnGoogleLogin.addEventListener('click', () => {
    signInWithPopup(auth, provider).then((result) => {
      currentTeacher = result.user;
      
      document.getElementById('btnOpenLogin').style.display = 'none';
      document.getElementById('teacherProfile').style.display = 'flex';
      document.querySelector('#teacherProfile .info div:nth-child(1)').textContent = currentTeacher.displayName;
      document.querySelector('#teacherProfile .info div:nth-child(2)').textContent = currentTeacher.email;
      if(currentTeacher.photoURL) document.getElementById('teacherAvatar').src = currentTeacher.photoURL;

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

/* B. LƯU LỚP HỌC LÊN DATABASE */
window.parseAndSaveClass = function() {
  if(!currentTeacher) return alert("Vui lòng đăng nhập Google trước khi lưu dữ liệu!");
  
  const text = document.getElementById('classDataEditor').value;
  if(!text.trim()) return alert("Dữ liệu trống!");

  try {
    const lopMatch = text.match(/\[(?:LOP|CLASS)\]:\s*(.*)/i);
    const namHocMatch = text.match(/\[NAMHOC\]:\s*(.*)/i);
    
    if(!lopMatch || !namHocMatch) throw new Error("Sai cấu trúc TXT");

    const className = lopMatch[1].trim().toUpperCase();
    const teacherId = document.getElementById('teacherUniqueId').value;
    
    const classData = {
      className: className,
      schoolYear: namHocMatch[1].trim(),
      createdAt: new Date().toISOString(),
      rawData: text
    };

    const dbRef = ref(db, `Teachers/${teacherId}/Classes/${className}`);
    set(dbRef, classData).then(() => {
      alert(`Đã lưu lớp ${className} lên hệ thống đám mây thành công!`);
    }).catch((error) => {
      alert("Lỗi khi lưu lên hệ thống: " + error.message);
    });

  } catch(err) {
    alert("Lỗi biên dịch TXT. Vui lòng kiểm tra lại định dạng.");
  }
};

/* C. LƯU KỊCH BẢN LÊN DATABASE */
const btnSavePlan = document.querySelector('#tab-plan .btn-submit');
if(btnSavePlan) {
  btnSavePlan.addEventListener('click', () => {
    if(!currentTeacher) return alert("Vui lòng đăng nhập trước!");
    
    const planTitle = document.getElementById('planTitle').value.trim();
    if(!planTitle) return alert("Vui lòng nhập Tiêu đề buổi học!");
    
    if(window.currentPlan.length === 0) return alert("Kế hoạch đang trống, hãy thêm ít nhất 1 hoạt động!");

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
      alert("Lưu kịch bản giảng dạy thành công! Sẵn sàng để kích hoạt phiên học.");
      
      set(ref(db, `ActiveSessions/${teacherId}`), {
         currentPlanId: planId,
         currentStepIndex: 0,
         activeFeature: window.currentPlan[0].id
      });
    }).catch(err => alert("Lỗi lưu trữ: " + err.message));
  });
}

/* D. HỌC SINH JOIN LỚP */
const btnJoinClass = document.getElementById('btnJoinClass');
if(btnJoinClass) {
  btnJoinClass.addEventListener('click', () => {
    const studentId = document.getElementById('studentGroupId').value.trim().toUpperCase();
    const pins = Array.from(document.querySelectorAll('.pin-box')).map(i => i.value).join('');
    
    if(!studentId || pins.length < 4) return alert("Nhập đủ ID và 4 số PIN!");

    const teacherId = studentId.split('-')[0];
    if(!teacherId) return alert("Mã định danh không hợp lệ!");

    alert(`Đang kết nối vào phòng học của GV: ${teacherId}...`);
    
    const sessionRef = ref(db, `ActiveSessions/${teacherId}`);
    onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if(data && data.activeFeature) {
        console.log("Giáo viên đã chuyển màn hình sang trò chơi/tính năng:", data.activeFeature);
        
        document.body.innerHTML = `<div style="padding:50px; text-align:center;">
           <h2 style="color:var(--primary-cyan);">BẠN ĐÃ VÀO PHÒNG</h2>
           <p>Giáo viên đang chạy tính năng mã: <b>${data.activeFeature}</b></p>
           <p><i>(UI của bạn sẽ tự thay đổi khi giáo viên bấm nút Next trên máy của họ)</i></p>
        </div>`;
      } else {
        console.log("Giáo viên chưa mở phiên học nào.");
      }
    });
  });
}
