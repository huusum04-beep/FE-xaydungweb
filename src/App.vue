<script setup>
import { ref, computed, onMounted, watch } from 'vue';
// Đảm bảo có import 'req' để gọi API Thêm/Sửa/Xóa
import { authAPI, studentAPI, lopAPI, monHocAPI, diemAPI, transferAPI, toList, getUser, req } from './api';

// --- QUẢN LÝ TRẠNG THÁI CHUNG ---
const user = ref(getUser());
const loading = ref(false);
const loginForm = ref({ username: '', password: '' });
const loginError = ref('');

const tableData = ref([]);
const profileData = ref(null);
const searchMssv = ref('');
const transferForm = ref({ malopmoi: '', reason: '' });

// --- KIỂM TRA QUYỀN ADMIN ---
const isAdmin = computed(() => {
  if (!user.value) return false;
  const role = (user.value.role || user.value.Role || '').toLowerCase();
  return role === 'admin' || user.value.isAdmin === true || user.value.username === 'ad' || user.value.username === 'admin';
});

const activeTab = ref(user.value ? (isAdmin.value ? 'students_admin' : 'profile') : 'profile');

// --- HÀM XỬ LÝ ĐĂNG NHẬP / ĐĂNG XUẤT ---
const handleLogin = async () => {
  loginError.value = '';
  try {
    const data = await authAPI.login(loginForm.value);
    user.value = data.user;
    localStorage.setItem('user', JSON.stringify(data.user));
    activeTab.value = isAdmin.value ? 'students_admin' : 'profile';
    fetchData();
  } catch (err) {
    loginError.value = "Tài khoản hoặc mật khẩu không chính xác!";
  }
};

const handleLogout = () => {
  user.value = null;
  localStorage.removeItem('user');
  window.location.reload();
};

// --- HÀM TẢI DỮ LIỆU ---
const fetchData = async () => {
  if (!user.value) return;
  loading.value = true;
  tableData.value = []; 
  
  try {
    if (activeTab.value === 'profile') {
      profileData.value = await studentAPI.getProfile();
    } else if (activeTab.value === 'students') {
      tableData.value = toList(await studentAPI.getAll());
    } else if (activeTab.value === 'lops') {
      tableData.value = toList(await lopAPI.getAll());
    } else if (activeTab.value === 'subjects') {
      tableData.value = toList(await monHocAPI.getAll());
    } 
    // ADMIN
    else if (activeTab.value === 'students_admin') {
      tableData.value = toList(await studentAPI.getAll());
    } else if (activeTab.value === 'lops_admin') {
      tableData.value = toList(await lopAPI.getAll());
      console.log("Check data LỚP:", tableData.value); // Để kiểm tra dữ liệu lớp
    } else if (activeTab.value === 'subjects_admin') {
      tableData.value = toList(await monHocAPI.getAll());
    } else if (activeTab.value === 'transfers_admin') {
      tableData.value = toList(await transferAPI.getPending());
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// ==========================================
// CHỨC NĂNG THÊM / SỬA / XÓA (DÀNH CHO ADMIN)
// ==========================================
const showModal = ref(false);
const modalMode = ref('add'); // 'add' hoặc 'edit'
const formData = ref({});
const isProcessing = ref(false);

// Cấu hình API tương ứng với từng Tab
const getApiConfig = () => {
  if (activeTab.value === 'students_admin') return { path: '/students', idField: 'mssv' };
  if (activeTab.value === 'lops_admin') return { path: '/lops', idField: 'malop' }; // Có thể là 'id' tùy backend
  if (activeTab.value === 'subjects_admin') return { path: '/monhocs', idField: 'mamh' };
  return null;
};

// Bật form Thêm mới
const openAddModal = () => {
  formData.value = {};
  modalMode.value = 'add';
  showModal.value = true;
};

// Bật form Sửa (Copy dữ liệu dòng hiện tại vào form)
const openEditModal = (item) => {
  formData.value = { ...item };
  modalMode.value = 'edit';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  formData.value = {};
};

// Xử lý Lưu (POST hoặc PUT)
const handleSave = async () => {
  const config = getApiConfig();
  if (!config) return;
  isProcessing.value = true;

  try {
    if (modalMode.value === 'add') {
      // THÊM MỚI (POST)
      await req(config.path, { method: 'POST', body: JSON.stringify(formData.value) });
      alert('Thêm bản ghi thành công!');
    } else {
      // CẬP NHẬT (PUT) - Lấy ID từ formData
      const id = formData.value[config.idField] || formData.value.id; 
      await req(`${config.path}/${id}`, { method: 'PUT', body: JSON.stringify(formData.value) });
      alert('Cập nhật thành công!');
    }
    closeModal();
    fetchData(); // Tải lại bảng
  } catch (err) {
    alert('Lỗi: ' + err.message);
  } finally {
    isProcessing.value = false;
  }
};

// Xử lý Xóa (DELETE)
const handleDelete = async (item) => {
  const config = getApiConfig();
  if (!config) return;
  const id = item[config.idField] || item.id;
  
  if (!confirm(`Hành động này không thể hoàn tác! Bạn có chắc muốn xóa bản ghi [${id}]?`)) return;

  try {
    await req(`${config.path}/${id}`, { method: 'DELETE' });
    alert('Đã xóa thành công!');
    fetchData();
  } catch (err) {
    alert('Lỗi khi xóa: ' + err.message);
  }
};

// --- CHỨC NĂNG DUYỆT CHUYỂN LỚP (ADMIN) ---
const approveTransfer = async (id) => {
  if (!confirm("Xác nhận phê duyệt yêu cầu này?")) return;
  try {
    await transferAPI.approve(id);
    alert("Đã phê duyệt thành công!");
    fetchData(); 
  } catch (err) {
    alert(err.message);
  }
};

// --- CHỨC NĂNG USER ---
const handleSearchGrades = async () => {
  if (!searchMssv.value) return;
  loading.value = true;
  try {
    tableData.value = toList(await diemAPI.getBySV(searchMssv.value));
  } catch (err) {
    alert("Không tìm thấy sinh viên!");
    tableData.value = [];
  } finally {
    loading.value = false;
  }
};

const submitTransfer = async () => {
  try {
    await transferAPI.submit(transferForm.value);
    alert("Gửi yêu cầu chuyển lớp thành công!");
    transferForm.value = { malopmoi: '', reason: '' };
  } catch (err) {
    alert("Lỗi: " + err.message);
  }
};

watch(activeTab, fetchData);
onMounted(fetchData);
</script>

<template>
  <div class="app-container">
    
    <div v-if="!user" class="login-wrapper">
      <div class="login-card">
        <h1>STU Portal</h1>
        <p>Hệ thống quản lý sinh viên</p>
        <div v-if="loginError" class="err-msg">{{ loginError }}</div>
        <form @submit.prevent="handleLogin">
          <input v-model="loginForm.username" type="text" placeholder="Tên đăng nhập" required />
          <input v-model="loginForm.password" type="password" placeholder="Mật khẩu" required />
          <button type="submit" class="btn-main">Đăng Nhập</button>
        </form>
      </div>
    </div>

    <div v-else-if="isAdmin" class="neo-layout">
      
      <aside class="neo-sidebar">
        <div class="neo-logo">
          <div class="neo-logo-square">STU</div>
          <h2>ADMIN PANEL</h2>
        </div>
        
        <div class="neo-nav">
          <p class="neo-nav-label">DATABASE QUẢN TRỊ</p>
          <button @click="activeTab = 'students_admin'" :class="{ active: activeTab === 'students_admin' }">▤ Danh sách Sinh Viên</button>
          <button @click="activeTab = 'lops_admin'" :class="{ active: activeTab === 'lops_admin' }">▤ Danh mục Lớp</button>
          <button @click="activeTab = 'subjects_admin'" :class="{ active: activeTab === 'subjects_admin' }">▤ Danh mục Môn Học</button>
          <p class="neo-nav-label" style="margin-top: 20px;">TÁC VỤ</p>
          <button @click="activeTab = 'transfers_admin'" :class="{ active: activeTab === 'transfers_admin' }">☑ Xét duyệt Chuyển Lớp</button>
        </div>

        <div class="neo-sidebar-footer">
          <div class="neo-user-info">
            <span class="u-role">System Admin</span>
            <span class="u-name">@{{ user.username }}</span>
          </div>
          <button @click="handleLogout" class="neo-btn-logout">Đăng Xuất ➔</button>
        </div>
      </aside>

      <main class="neo-main">
        <header class="neo-header">
          <div class="neo-header-title">
            <h1>{{ activeTab === 'students_admin' ? 'Quản lý Sinh Viên' : activeTab === 'lops_admin' ? 'Quản lý Lớp' : activeTab === 'subjects_admin' ? 'Quản lý Môn Học' : activeTab === 'transfers_admin' ? 'Xét duyệt Chuyển Lớp' : 'Bảng điều khiển' }}</h1>
            <p>Hệ thống dữ liệu tập trung ({{ tableData.length }} bản ghi)</p>
          </div>
          
          <button v-if="activeTab !== 'transfers_admin'" class="neo-btn-primary" @click="openAddModal">
            + THÊM DỮ LIỆU
          </button>
        </header>

        <div class="neo-content">
          <div class="neo-table-wrapper">
            <div v-if="loading" class="neo-loading">Đang nạp dữ liệu hệ thống...</div>
            
            <table v-else class="neo-table">
              <thead>
                <tr v-if="activeTab === 'students_admin'">
                  <th>MSSV</th><th>HỌ VÀ TÊN</th><th>NGÀY SINH</th><th>GIỚI TÍNH</th><th>MÃ LỚP</th><th>THAO TÁC</th>
                </tr>
                <tr v-else-if="activeTab === 'lops_admin'">
                  <th>MÃ LỚP</th><th>TÊN LỚP</th><th>KHOA QUẢN LÝ</th><th>THAO TÁC</th>
                </tr>
                <tr v-else-if="activeTab === 'subjects_admin'">
                  <th>MÃ MÔN</th><th>TÊN MÔN HỌC</th><th>SỐ TIẾT LT</th><th>SỐ TIẾT TH</th><th>THAO TÁC</th>
                </tr>
                <tr v-else-if="activeTab === 'transfers_admin'">
                  <th>SINH VIÊN</th><th>LỚP HIỆN TẠI</th><th>MÃ LỚP XIN CHUYỂN</th><th>LÝ DO</th><th>THAO TÁC</th>
                </tr>
              </thead>
              
              <tbody>
                <tr v-if="tableData.length === 0"><td colspan="6" class="neo-empty">Không tìm thấy dữ liệu</td></tr>
                
                <tr v-for="(item, idx) in tableData" :key="idx">
                  
                  <template v-if="activeTab === 'students_admin'">
                    <td><span class="neo-badge dark">{{ item.mssv }}</span></td>
                    <td class="font-bold">{{ item.ho }} {{ item.ten }}</td>
                    <td>{{ item.ngaysinh }}</td>
                    <td>{{ item.gioitinh ? 'Nam' : 'Nữ' }}</td>
                    <td><span class="neo-badge teal">{{ item.malop || item.lop?.malop }}</span></td>
                  </template>

                  <template v-else-if="activeTab === 'lops_admin'">
                    <td><span class="neo-badge dark">{{ item.malop || item.id }}</span></td>
                    <td class="font-bold">{{ item.tenlop || item.name }}</td>
                    <td>{{ item.makhoa || item.department }}</td>
                  </template>

                  <template v-else-if="activeTab === 'subjects_admin'">
                    <td><span class="neo-badge dark">{{ item.mamh }}</span></td>
                    <td class="font-bold">{{ item.tenmh }}</td>
                    <td>{{ item.sotietlt }}</td>
                    <td>{{ item.sotietth }}</td>
                  </template>

                  <template v-else-if="activeTab === 'transfers_admin'">
                    <td class="font-bold">{{ item.student?.ho }} {{ item.student?.ten }}</td>
                    <td><span class="neo-badge dark">{{ item.student?.lop?.malop }}</span></td>
                    <td><span class="neo-badge teal">{{ item.malopmoi }}</span></td>
                    <td>{{ item.reason }}</td>
                  </template>

                  <td class="neo-td-actions">
                    <button v-if="activeTab === 'transfers_admin'" @click="approveTransfer(item.id)" class="neo-btn-action teal">Duyệt Đơn</button>
                    <template v-else>
                      <button @click="openEditModal(item)" class="neo-btn-action">Sửa</button>
                      <button @click="handleDelete(item)" class="neo-btn-action danger">Xóa</button>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <div v-if="showModal" class="neo-modal-overlay">
        <div class="neo-modal-box">
          <div class="neo-modal-header">
            <h3>{{ modalMode === 'add' ? 'THÊM DỮ LIỆU MỚI' : 'CẬP NHẬT DỮ LIỆU' }}</h3>
            <button @click="closeModal" class="neo-close-btn">✕</button>
          </div>
          
          <form @submit.prevent="handleSave" class="neo-modal-body">
            
            <template v-if="activeTab === 'students_admin'">
              <div class="neo-form-row">
                <div class="neo-form-group"><label>MSSV (*)</label><input v-model="formData.mssv" :disabled="modalMode==='edit'" required /></div>
                <div class="neo-form-group"><label>Mã Lớp (*)</label><input v-model="formData.malop" required /></div>
              </div>
              <div class="neo-form-row">
                <div class="neo-form-group"><label>Họ</label><input v-model="formData.ho" required /></div>
                <div class="neo-form-group"><label>Tên</label><input v-model="formData.ten" required /></div>
              </div>
              <div class="neo-form-row">
                <div class="neo-form-group"><label>Ngày sinh</label><input type="date" v-model="formData.ngaysinh" /></div>
                <div class="neo-form-group"><label>Giới tính</label>
                  <select v-model="formData.gioitinh">
                    <option :value="true">Nam</option>
                    <option :value="false">Nữ</option>
                  </select>
                </div>
              </div>
              <div class="neo-form-group"><label>Địa chỉ</label><input v-model="formData.diachi" /></div>
            </template>

            <template v-if="activeTab === 'lops_admin'">
              <div class="neo-form-group"><label>Mã Lớp (*)</label><input v-model="formData.malop" :disabled="modalMode==='edit'" required /></div>
              <div class="neo-form-group"><label>Tên Lớp (*)</label><input v-model="formData.tenlop" required /></div>
              <div class="neo-form-group"><label>Mã Khoa</label><input v-model="formData.makhoa" /></div>
            </template>

            <template v-if="activeTab === 'subjects_admin'">
              <div class="neo-form-group"><label>Mã Môn Học (*)</label><input v-model="formData.mamh" :disabled="modalMode==='edit'" required /></div>
              <div class="neo-form-group"><label>Tên Môn Học (*)</label><input v-model="formData.tenmh" required /></div>
              <div class="neo-form-row">
                <div class="neo-form-group"><label>Số tiết Lý Thuyết</label><input type="number" v-model="formData.sotietlt" required /></div>
                <div class="neo-form-group"><label>Số tiết Thực Hành</label><input type="number" v-model="formData.sotietth" required /></div>
              </div>
            </template>

            <div class="neo-modal-footer">
              <button type="button" @click="closeModal" class="neo-btn-cancel">Hủy bỏ</button>
              <button type="submit" class="neo-btn-primary" :disabled="isProcessing">
                {{ isProcessing ? 'Đang lưu...' : 'LƯU DỮ LIỆU' }}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>

    <div v-else class="main-layout">
      <header class="navbar">
        <div class="logo">🚀 STU Management</div>
        <div class="user-box">
          <span>Xin chào, <b>{{ user.username }}</b></span>
          <button @click="handleLogout" class="btn-out" style="margin-left: 15px;">Đăng xuất</button>
        </div>
      </header>

      <div class="content-body">
        <nav class="sidebar">
          <button @click="activeTab = 'profile'" :class="{ active: activeTab === 'profile' }"> Trang cá nhân</button>
          <button @click="activeTab = 'students'" :class="{ active: activeTab === 'students' }"> Sinh viên</button>
          <button @click="activeTab = 'lops'" :class="{ active: activeTab === 'lops' }"> Lớp học</button>
          <button @click="activeTab = 'subjects'" :class="{ active: activeTab === 'subjects' }"> Môn học</button>
          <button @click="activeTab = 'grades'" :class="{ active: activeTab === 'grades' }"> Tra cứu điểm</button>
          <hr />
          <button @click="activeTab = 'transfer'" :class="{ active: activeTab === 'transfer' }">🔄 Yêu cầu chuyển lớp</button>
        </nav>

        <section class="view-panel">
          <div v-if="loading" class="loader">Đang xử lý...</div>

          <div v-if="activeTab === 'profile' && profileData" class="profile-card">
            <div class="profile-header">
              <div class="avatar-large">👤</div>
              <div class="info-main">
                <h2>{{ profileData.ho }} {{ profileData.ten }}</h2>
                <span class="badge mssv">{{ profileData.mssv }}</span>
              </div>
            </div>
            <div class="profile-grid">
              <div class="item"><b>Ngày sinh:</b> {{ profileData.ngaysinh }}</div>
              <div class="item"><b>Giới tính:</b> {{ profileData.gioitinh ? 'Nam' : 'Nữ' }}</div>
              <div class="item"><b>Lớp:</b> {{ profileData.lop?.tenlop }} ({{ profileData.lop?.malop }})</div>
              <div class="item"><b>Địa chỉ:</b> {{ profileData.diachi }}</div>
            </div>
          </div>

          <div v-if="activeTab === 'students'" class="card-table">
            <h3>Danh sách Sinh viên</h3>
            <table class="table">
              <thead><tr><th>STT</th><th>Họ Tên</th><th>MSSV</th><th>Lớp</th><th>Địa Chỉ</th></tr></thead>
              <tbody>
                <tr v-for="(sv, i) in tableData" :key="i">
                  <td>{{ i + 1 }}</td>
                  <td class="bold">{{ sv.ho }} {{ sv.ten }}</td>
                  <td><span class="pill gray">{{ sv.mssv }}</span></td>
                  <td><span class="pill blue">{{ sv.lop?.malop }}</span></td>
                  <td>{{ sv.diachi }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="activeTab === 'lops'" class="card-table">
            <h3>Danh sách Lớp học</h3>
            <table class="table">
              <thead><tr><th>Mã Lớp</th><th>Tên Lớp</th><th>Khoa</th></tr></thead>
              <tbody>
                <tr v-for="l in tableData" :key="l.malop">
                  <td><span class="pill green">{{ l.malop }}</span></td>
                  <td class="bold">{{ l.tenlop }}</td>
                  <td>{{ l.makhoa }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="activeTab === 'subjects'" class="card-table">
            <h3>Danh sách Môn học</h3>
            <table class="table">
              <thead><tr><th>Mã Môn</th><th>Tên Môn</th><th>LT</th><th>TH</th></tr></thead>
              <tbody>
                <tr v-for="item in tableData" :key="item.mamh">
                  <td><span class="pill yellow">{{ item.mamh }}</span></td>
                  <td class="bold">{{ item.tenmh }}</td>
                  <td>{{ item.sotietlt }}</td>
                  <td>{{ item.sotietth }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="activeTab === 'grades'" class="card-table">
            <div class="search-bar">
              <input v-model="searchMssv" placeholder="Nhập MSSV sinh viên..." />
              <button @click="handleSearchGrades" class="btn-main">Tìm</button>
            </div>
            <table class="table mt-20">
              <thead><tr><th>Môn Học</th><th>Lần</th><th>Điểm</th></tr></thead>
              <tbody>
                <tr v-for="(d, i) in tableData" :key="i">
                  <td class="bold">{{ d.monHoc?.tenmh }}</td>
                  <td>Lần {{ d.id.lan }}</td>
                  <td><span :class="['pill', d.diem >= 5 ? 'green' : 'pink']">{{ d.diem }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="activeTab === 'transfer'" class="profile-card">
            <h3>Đơn xin chuyển lớp</h3>
            <div class="form-group">
              <label>Mã lớp mới muốn chuyển đến:</label>
              <input v-model="transferForm.malopmoi" placeholder="VD: D22_TH01" />
            </div>
            <div class="form-group">
              <label>Lý do chuyển lớp:</label>
              <textarea v-model="transferForm.reason" rows="4"></textarea>
            </div>
            <button @click="submitTransfer" class="btn-main">Gửi yêu cầu</button>
          </div>

        </section>
      </div>
    </div>
  </div>
</template>

<style>
/* =========================================
   STYLE CHUNG & USER (Của bạn - Giữ nguyên)
========================================= */
body { margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f7f6; color: #333; }
.app-container { min-height: 100vh; }
.login-wrapper { display: flex; justify-content: center; align-items: center; height: 100vh; background: #2c3e50; }
.login-card { background: white; padding: 40px; border-radius: 15px; width: 350px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
.login-card h1 { color: #3498db; margin-bottom: 5px; }
.login-card input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
.btn-main { background: #3498db; color: white; border: none; padding: 12px 25px; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%; }
.navbar { background: white; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.content-body { display: flex; padding: 20px; gap: 20px; }
.sidebar { width: 250px; background: white; border-radius: 10px; padding: 15px; height: fit-content; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.sidebar button { width: 100%; text-align: left; padding: 12px; border: none; background: none; cursor: pointer; font-size: 15px; border-radius: 5px; margin-bottom: 5px; }
.sidebar button.active { background: #3498db; color: white; }
.view-panel { flex: 1; }
.profile-card { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.profile-header { display: flex; gap: 20px; align-items: center; margin-bottom: 30px; }
.avatar-large { font-size: 50px; background: #eee; padding: 20px; border-radius: 50%; }
.profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.card-table { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.table { width: 100%; border-collapse: collapse; margin-top: 15px; }
.table th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #eee; font-size: 14px; }
.table td { padding: 12px; border-bottom: 1px solid #f1f1f1; font-size: 15px; }
.pill { padding: 4px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; }
.pill.gray { background: #eee; color: #666; }
.pill.blue { background: #e3f2fd; color: #1976d2; }
.pill.green { background: #e8f5e9; color: #2e7d32; }
.pill.pink { background: #fce4ec; color: #c2185b; }
.pill.yellow { background: #fef3c7; color: #d97706; }
.search-bar { display: flex; gap: 10px; }
.search-bar input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
.search-bar button { width: 100px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.form-group input, .form-group textarea, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
.err-msg { color: #e74c3c; background: #fadbd8; padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 14px; }

/* =========================================
   STYLE ADMIN: NEO DESIGN (GÓC CẠNH, DARK TÔNG TEAL)
========================================= */
.neo-layout { display: flex; height: 100vh; background-color: #f1f5f9; font-family: 'Segoe UI', system-ui, sans-serif; }

/* Sidebar: Đen nhám */
.neo-sidebar { width: 260px; background: #0f172a; color: #94a3b8; display: flex; flex-direction: column; flex-shrink: 0; }
.neo-logo { padding: 24px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #1e293b; }
.neo-logo-square { background: #0d9488; color: white; width: 36px; height: 36px; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 14px; letter-spacing: 1px;}
.neo-logo h2 { color: white; font-size: 16px; margin: 0; font-weight: 700; letter-spacing: 1px;}

.neo-nav { padding: 20px 16px; flex: 1; overflow-y: auto;}
.neo-nav-label { font-size: 11px; color: #64748b; font-weight: bold; margin-bottom: 10px; padding-left: 10px; }
.neo-nav button { width: 100%; text-align: left; padding: 12px; border: none; background: transparent; color: #cbd5e1; font-size: 14px; cursor: pointer; border-left: 3px solid transparent; transition: 0.2s; margin-bottom: 4px;}
.neo-nav button:hover { background: #1e293b; color: white; }
.neo-nav button.active { background: #1e293b; color: #2dd4bf; border-left-color: #0d9488; font-weight: 600; }

.neo-sidebar-footer { padding: 20px; border-top: 1px solid #1e293b; }
.neo-user-info { display: flex; flex-direction: column; margin-bottom: 16px; }
.u-role { font-size: 11px; color: #0d9488; font-weight: bold; text-transform: uppercase; }
.u-name { font-size: 14px; color: white; font-weight: 500; }
.neo-btn-logout { width: 100%; background: transparent; border: 1px solid #334155; color: #cbd5e1; padding: 10px; font-size: 13px; cursor: pointer; transition: 0.2s; }
.neo-btn-logout:hover { border-color: #ef4444; color: #ef4444; }

/* Main Content */
.neo-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 0; }
.neo-header { background: white; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
.neo-header-title h1 { font-size: 22px; color: #0f172a; margin: 0 0 4px 0; font-weight: 700; text-transform: uppercase; }
.neo-header-title p { font-size: 13px; color: #64748b; margin: 0; }
.neo-btn-primary { background: #0f172a; color: white; border: none; padding: 10px 20px; font-size: 13px; font-weight: bold; cursor: pointer; transition: 0.2s; letter-spacing: 0.5px;}
.neo-btn-primary:hover { background: #0d9488; }

.neo-content { flex: 1; padding: 32px; overflow: auto; }
.neo-table-wrapper { background: white; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.neo-loading { padding: 30px; text-align: center; color: #0d9488; font-weight: bold; }
.neo-empty { padding: 40px; text-align: center; color: #94a3b8; }

/* Bảng dữ liệu sắc cạnh */
.neo-table { width: 100%; border-collapse: collapse; text-align: left; }
.neo-table th { padding: 14px 20px; font-size: 11px; font-weight: bold; color: #475569; background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px;}
.neo-table td { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; }
.neo-table tbody tr:hover { background: #f8fafc; }
.font-bold { font-weight: 600; color: #0f172a; }

.neo-badge { padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 2px; }
.neo-badge.dark { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
.neo-badge.teal { background: #ccfbf1; color: #0f766e; border: 1px solid #99f6e4; }

.neo-td-actions { display: flex; gap: 8px; }
.neo-btn-action { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.neo-btn-action:hover { background: #f1f5f9; border-color: #94a3b8; color: #0f172a; }
.neo-btn-action.danger:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
.neo-btn-action.teal { background: #0f172a; color: white; border-color: #0f172a; }
.neo-btn-action.teal:hover { background: #0d9488; border-color: #0d9488; }

/* =========================================
   MODAL (HỘP THOẠI FORM) DÀNH CHO ADMIN
========================================= */
.neo-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(2px);}
.neo-modal-box { background: white; width: 100%; max-width: 500px; border-radius: 4px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; display: flex; flex-direction: column;}
.neo-modal-header { background: #0f172a; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
.neo-modal-header h3 { margin: 0; color: white; font-size: 16px; font-weight: 600; letter-spacing: 0.5px;}
.neo-close-btn { background: transparent; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; }
.neo-close-btn:hover { color: white; }

.neo-modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.neo-form-row { display: flex; gap: 16px; }
.neo-form-row .neo-form-group { flex: 1; margin: 0; }
.neo-form-group { margin: 0; }
.neo-form-group label { display: block; font-size: 12px; font-weight: bold; color: #475569; margin-bottom: 6px; }
.neo-form-group input, .neo-form-group select { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; color: #0f172a; outline: none; transition: 0.2s; box-sizing: border-box; }
.neo-form-group input:focus, .neo-form-group select:focus { border-color: #0d9488; box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.1); }
.neo-form-group input:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }

.neo-modal-footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px; }
.neo-btn-cancel { background: white; border: 1px solid #cbd5e1; padding: 10px 20px; font-size: 13px; font-weight: bold; color: #475569; cursor: pointer; border-radius: 4px;}
.neo-btn-cancel:hover { background: #f1f5f9; }
</style>