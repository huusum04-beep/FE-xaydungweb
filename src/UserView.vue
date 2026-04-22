<script setup>
import { ref, onMounted, watch } from 'vue';
import { studentAPI, lopAPI, monHocAPI, diemAPI, transferAPI, toList } from './api';

const props = defineProps(['user']);
const emit = defineEmits(['logout']);

const activeTab = ref('profile'); // Mặc định vào Trang cá nhân
const loading = ref(false);

const tableData = ref([]);
const profileData = ref(props.user); // Lấy tạm dữ liệu user từ App.vue truyền sang
const searchMssv = ref('');
const transferForm = ref({ malopmoi: '', reason: '' });

// Gọi API lấy dữ liệu
const fetchData = async () => {
  loading.value = true;
  tableData.value = [];
  try {
    if (activeTab.value === 'profile') {
      try {
        // Cố gắng gọi API lấy profile mới nhất
        const res = await studentAPI.getProfile();
        if (res) profileData.value = res;
      } catch (err) {
        console.warn("Không lấy được profile, dùng tạm data đăng nhập");
      }
    } else if (activeTab.value === 'students') {
      tableData.value = toList(await studentAPI.getAll());
    } else if (activeTab.value === 'lops') {
      tableData.value = toList(await lopAPI.getAll());
    } else if (activeTab.value === 'subjects') {
      tableData.value = toList(await monHocAPI.getAll());
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Tra cứu điểm
const handleSearchGrades = async () => {
  if (!searchMssv.value) return;
  loading.value = true;
  try {
    tableData.value = toList(await diemAPI.getBySV(searchMssv.value));
  } catch (err) {
    alert("Không tìm thấy điểm cho MSSV này");
  } finally {
    loading.value = false;
  }
};

// Gửi yêu cầu chuyển lớp
const submitTransfer = async () => {
  if (!transferForm.value.malopmoi) {
    alert("Vui lòng nhập mã lớp mới!");
    return;
  }
  try {
    await transferAPI.submit(transferForm.value);
    alert("Gửi yêu cầu chuyển lớp thành công! Vui lòng chờ Giáo vụ duyệt.");
    transferForm.value = { malopmoi: '', reason: '' };
  } catch (err) {
    alert("Lỗi: " + err.message);
  }
};

watch(activeTab, fetchData);
onMounted(fetchData);
</script>

<template>
  <div class="main-layout">
    <header class="navbar">
      <div class="logo">🚀 STU Management</div>
      <div class="user-box">
        <span>Xin chào, <b>{{ profileData?.username || profileData?.ho + ' ' + profileData?.ten }}</b></span>
        <button @click="$emit('logout')" class="btn-out ml-3">Đăng xuất</button>
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
        <button @click="activeTab = 'transfer'" :class="{ active: activeTab === 'transfer' }"> Yêu cầu chuyển lớp</button>
      </nav>

      <section class="view-panel">
        <div v-if="loading" class="loader mb-4 text-blue-600 font-bold">Đang xử lý dữ liệu...</div>

        <div v-if="activeTab === 'profile'" class="profile-card">
          <div class="profile-header">
            <div class="avatar-large">🎓</div>
            <div class="info-main">
              <h2>{{ profileData?.ho ? `${profileData.ho} ${profileData.ten}` : (profileData?.username || 'Chưa cập nhật tên') }}</h2>
              <span class="pill blue">{{ profileData?.mssv || 'Chưa có MSSV' }}</span>
            </div>
          </div>
          
          <div class="profile-grid">
            <div class="item">
              <span class="label">Ngày sinh:</span>
              <span class="val">{{ profileData?.ngaysinh || '---' }}</span>
            </div>
            <div class="item">
              <span class="label">Giới tính:</span>
              <span class="val">
                <span v-if="profileData?.gioitinh !== undefined" :class="['pill', profileData?.gioitinh ? 'blue' : 'pink']">
                  {{ profileData?.gioitinh ? 'Nam' : 'Nữ' }}
                </span>
                <span v-else>---</span>
              </span>
            </div>
            <div class="item">
              <span class="label">Lớp hiện tại:</span>
              <span class="val">{{ profileData?.lop?.malop || 'Chưa xếp lớp' }}</span>
            </div>
            <div class="item">
              <span class="label">Địa chỉ:</span>
              <span class="val">{{ profileData?.diachi || '---' }}</span>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'transfer'" class="profile-card">
          <h3 class="text-xl font-bold mb-4 text-gray-800">Đơn xin chuyển lớp</h3>
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p class="text-sm text-yellow-700">Lưu ý: Yêu cầu chuyển lớp của bạn sẽ được gửi đến ban giáo vụ để phê duyệt. Vui lòng ghi rõ lý do.</p>
          </div>
          
          <div class="form-group">
            <label>Mã lớp mới muốn chuyển đến:</label>
            <input v-model="transferForm.malopmoi" type="text" placeholder="VD: D22TH01" />
          </div>
          <div class="form-group">
            <label>Lý do xin chuyển lớp:</label>
            <textarea v-model="transferForm.reason" rows="4" placeholder="Nhập lý do chi tiết..."></textarea>
          </div>
          <button @click="submitTransfer" class="btn-main">Gửi Yêu Cầu</button>
        </div>

        <div v-if="['students', 'lops', 'subjects'].includes(activeTab)" class="card-table">
          <h3 class="text-lg font-bold mb-4 uppercase text-gray-700">Danh sách {{ activeTab === 'students' ? 'Sinh viên' : activeTab === 'lops' ? 'Lớp học' : 'Môn học' }}</h3>
          <table class="table">
            <thead>
              <tr v-if="activeTab === 'students'"><th>STT</th><th>Họ Tên</th><th>MSSV</th><th>Lớp</th><th>Địa Chỉ</th></tr>
              <tr v-if="activeTab === 'lops'"><th>Mã Lớp</th><th>Tên Lớp</th><th>Khoa</th></tr>
              <tr v-if="activeTab === 'subjects'"><th>Mã Môn</th><th>Tên Môn</th><th>LT</th><th>TH</th></tr>
            </thead>
            <tbody>
              <tr v-if="tableData.length === 0"><td colspan="5" class="text-center py-4 text-gray-500">Không có dữ liệu</td></tr>
              <tr v-for="(item, i) in tableData" :key="i">
                <template v-if="activeTab === 'students'">
                  <td>{{ i + 1 }}</td><td class="bold">{{ item.ho }} {{ item.ten }}</td>
                  <td><span class="pill gray">{{ item.mssv }}</span></td>
                  <td><span class="pill green">{{ item.lop?.malop }}</span></td><td>{{ item.diachi }}</td>
                </template>
                <template v-if="activeTab === 'lops'">
                  <td><span class="pill green">{{ item.malop }}</span></td><td class="bold">{{ item.tenlop }}</td><td>{{ item.makhoa }}</td>
                </template>
                <template v-if="activeTab === 'subjects'">
                  <td><span class="pill yellow">{{ item.mamh }}</span></td><td class="bold">{{ item.tenmh }}</td>
                  <td>{{ item.sotietlt }}</td><td>{{ item.sotietth }}</td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="activeTab === 'grades'" class="card-table">
          <h3 class="text-lg font-bold mb-4 uppercase text-gray-700">Tra cứu điểm cá nhân</h3>
          <div class="search-bar">
            <input v-model="searchMssv" placeholder="Nhập MSSV của bạn (VD: SV001)..." />
            <button @click="handleSearchGrades" class="btn-main w-auto px-6">Tra cứu</button>
          </div>
          <table class="table mt-4" v-if="tableData.length > 0">
            <thead><tr><th>Môn Học</th><th>Lần Thi</th><th>Điểm Số</th></tr></thead>
            <tbody>
              <tr v-for="(d, i) in tableData" :key="i">
                <td class="bold">{{ d.monHoc?.tenmh }}</td>
                <td>Lần {{ d.id.lan }}</td>
                <td><span :class="['pill', d.diem >= 5 ? 'green' : 'pink']">{{ d.diem }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

      </section>
    </div>
  </div>
</template>

<style scoped>
/* Reset & Layout cơ bản */
.main-layout { background: #f4f7f6; min-height: 100vh; font-family: sans-serif; color: #333; }
.navbar { background: white; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.logo { font-size: 20px; font-weight: bold; color: #3498db; }
.btn-out { background: #fdf2f2; color: #e74c3c; border: 1px solid #fadbd8; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; margin-left: 15px; transition: 0.2s;}
.btn-out:hover { background: #fadbd8; }

.content-body { display: flex; padding: 20px; gap: 20px; max-width: 1200px; margin: 0 auto; }

/* Menu Trái */
.sidebar { width: 250px; background: white; border-radius: 10px; padding: 15px; height: fit-content; box-shadow: 0 2px 10px rgba(0,0,0,0.05); flex-shrink: 0; }
.sidebar button { width: 100%; text-align: left; padding: 12px 15px; border: none; background: none; cursor: pointer; font-size: 14.5px; border-radius: 8px; margin-bottom: 5px; color: #4b5563; transition: 0.2s; }
.sidebar button:hover { background: #f3f4f6; }
.sidebar button.active { background: #3498db; color: white; font-weight: 600; }
.sidebar hr { border: 0; border-top: 1px solid #eee; margin: 10px 0; }

.view-panel { flex: 1; min-width: 0; }

/* Trang Cá Nhân */
.profile-card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.profile-header { display: flex; gap: 20px; align-items: center; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
.avatar-large { font-size: 50px; background: #f3f4f6; width: 90px; height: 90px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.info-main h2 { margin: 0 0 8px 0; color: #1f2937; font-size: 24px; }
.profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.profile-grid .item { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #f3f4f6; }
.item .label { display: block; color: #6b7280; font-size: 13px; margin-bottom: 5px; font-weight: 600; }
.item .val { font-size: 15px; color: #111827; font-weight: 500; }

/* Form Chuyển Lớp */
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px; }
.form-group input, .form-group textarea { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; box-sizing: border-box; outline: none; transition: 0.2s; }
.form-group input:focus, .form-group textarea:focus { border-color: #3498db; box-shadow: 0 0 0 3px rgba(52,152,219,0.1); }
.btn-main { background: #3498db; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s; }
.btn-main:hover { background: #2980b9; }

/* Bảng Dữ Liệu */
.card-table { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.table { width: 100%; border-collapse: collapse; }
.table th { background: #f9fafb; padding: 12px 15px; text-align: left; border-bottom: 2px solid #e5e7eb; font-size: 13px; color: #6b7280; }
.table td { padding: 15px; border-bottom: 1px solid #f3f4f6; font-size: 14.5px; }
.bold { font-weight: 600; color: #1f2937; }

/* Pills / Badges */
.pill { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-block; border: 1px solid transparent;}
.pill.gray { background: #f3f4f6; color: #4b5563; border-color: #e5e7eb;}
.pill.blue { background: #eff6ff; color: #2563eb; border-color: #dbeafe;}
.pill.green { background: #f0fdf4; color: #16a34a; border-color: #dcfce7;}
.pill.pink { background: #fdf2f8; color: #db2777; border-color: #fce7f3;}
.pill.yellow { background: #fffbeb; color: #d97706; border-color: #fef3c7;}

.search-bar { display: flex; gap: 10px; }
.search-bar input { flex: 1; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; }
.search-bar input:focus { border-color: #3498db; }
</style>