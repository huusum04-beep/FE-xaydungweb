<script setup>
import { ref, onMounted, watch } from 'vue'
import { studentAPI, lopAPI, monHocAPI, toList } from './api'

// Khai báo props để nhận cục 'user' từ App.vue truyền sang
const props = defineProps(['user'])
const emit = defineEmits(['logout'])

const activeTab = ref('students')
const loading = ref(false)
const tableData = ref([])
const errorMessage = ref('') // Biến mới để hứng lỗi hiện lên màn hình

// Hàm tải dữ liệu cực kỳ cẩn thận
const fetchData = async () => {
  loading.value = true
  errorMessage.value = '' // Reset lỗi cũ
  tableData.value = [] // Reset bảng cũ

  try {
    let res;
    if (activeTab.value === 'students') {
      res = await studentAPI.getAll();
    } else if (activeTab.value === 'lops') {
      res = await lopAPI.getAll();
    } else if (activeTab.value === 'subjects') {
      res = await monHocAPI.getAll();
    }
    
    // Gắn dữ liệu vào bảng
    if (res) {
      tableData.value = toList(res);
      if (tableData.value.length === 0) {
        errorMessage.value = "API gọi thành công nhưng không có dữ liệu nào (Mảng rỗng).";
      }
    }
  } catch (err) {
    console.error("Lỗi tải dữ liệu:", err);
    errorMessage.value = "Lỗi khi gọi API: " + err.message;
  } finally {
    loading.value = false;
  }
}

// Khi click đổi menu bên trái -> Tự động gọi lại fetchData
watch(activeTab, fetchData)

// Vừa vào trang là tự động gọi dữ liệu Sinh viên đầu tiên
onMounted(fetchData)

const tabNames = {
  students: 'Sinh Viên',
  lops: 'Lớp Học',
  subjects: 'Môn Học'
}
</script>

<template>
  <div class="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
    
    <aside class="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
      <div>
        <div class="h-20 flex items-center px-6 gap-3 border-b border-slate-100">
          <div class="bg-indigo-600 text-white p-2 rounded-lg font-bold text-xl">STU</div>
          <span class="text-xl font-black text-slate-800 tracking-tight">EduManage</span>
        </div>

        <div class="px-4 py-6 space-y-1">
          <div class="text-xs font-bold text-slate-400 mb-4 px-2 tracking-wider">QUẢN LÝ</div>
          
          <button @click="activeTab = 'students'" 
            :class="['w-full flex items-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors', activeTab === 'students' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50']">
            Sinh Viên
          </button>
          <button @click="activeTab = 'lops'" 
            :class="['w-full flex items-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors', activeTab === 'lops' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50']">
            Lớp
          </button>
          <button @click="activeTab = 'subjects'" 
            :class="['w-full flex items-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors', activeTab === 'subjects' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50']">
            Môn Học
          </button>
        </div>
      </div>

      <div class="p-4 border-t border-slate-100 bg-slate-50/50">
        <div class="flex items-center gap-3 mb-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <div class="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
            {{ props.user?.username?.charAt(0).toUpperCase() || 'A' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-slate-800 truncate">{{ props.user?.username || 'Admin' }}</p>
            <p class="text-xs font-semibold text-indigo-600">ADMIN</p>
          </div>
        </div>
        <button @click="$emit('logout')" class="w-full flex justify-center items-center gap-2 bg-rose-50 text-rose-600 py-2.5 rounded-lg text-sm font-bold hover:bg-rose-100 transition-colors">
          Đăng xuất
        </button>
      </div>
    </aside>

    <main class="flex-1 flex flex-col h-screen overflow-hidden">
      <header class="px-8 py-6 flex justify-between items-end shrink-0">
        <div>
          <h1 class="text-3xl font-black text-slate-800 tracking-tight">{{ tabNames[activeTab] }}</h1>
          <p class="text-sm text-slate-500 mt-1 font-medium">{{ tableData.length }} bản ghi</p>
        </div>
        <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-indigo-200 transition-all">
          + Thêm Mới
        </button>
      </header>

      <div class="px-8 pb-8 flex-1 overflow-auto">
        <div class="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm mb-6 flex">
          <input type="text" placeholder="Tìm kiếm..." class="w-full px-4 py-2 outline-none text-sm text-slate-700 bg-transparent" />
        </div>

        <div v-if="errorMessage" class="mb-4 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded-r-lg shadow-sm">
          <strong>Oái! Có lỗi xảy ra:</strong> {{ errorMessage }}
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div v-if="loading" class="p-8 text-center text-indigo-600 font-bold animate-pulse">
            Đang tải dữ liệu, chờ chút nhé...
          </div>
          
          <table v-else class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th class="px-6 py-4 font-bold">#</th>
                
                <template v-if="activeTab === 'students'">
                  <th class="px-6 py-4 font-bold">Họ và Tên</th>
                  <th class="px-6 py-4 font-bold">MSSV</th>
                  <th class="px-6 py-4 font-bold">Lớp</th>
                </template>
                
                <template v-if="activeTab === 'subjects'">
                  <th class="px-6 py-4 font-bold">Mã Môn</th>
                  <th class="px-6 py-4 font-bold">Tên Môn Học</th>
                  <th class="px-6 py-4 font-bold">Lý Thuyết</th>
                  <th class="px-6 py-4 font-bold">Thực Hành</th>
                </template>

                <template v-if="activeTab === 'lops'">
                  <th class="px-6 py-4 font-bold">Mã Lớp</th>
                  <th class="px-6 py-4 font-bold">Tên Lớp</th>
                  <th class="px-6 py-4 font-bold">Khoa</th>
                </template>

                <th class="px-6 py-4 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            
            <tbody class="divide-y divide-slate-100">
              <tr v-if="tableData.length === 0 && !loading && !errorMessage" class="hover:bg-slate-50">
                <td colspan="6" class="px-6 py-8 text-center text-slate-400">Trống trơn, chưa có dữ liệu nào cả.</td>
              </tr>

              <tr v-for="(item, idx) in tableData" :key="idx" class="hover:bg-slate-50/80 group">
                <td class="px-6 py-4 text-sm text-slate-400 font-medium">{{ idx + 1 }}</td>
                
                <template v-if="activeTab === 'students'">
                  <td class="px-6 py-4 text-sm font-bold text-slate-800">{{ item.ho }} {{ item.ten }}</td>
                  <td class="px-6 py-4"><span class="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs font-bold">{{ item.mssv }}</span></td>
                  <td class="px-6 py-4"><span class="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-xs font-bold">{{ item.lop?.malop }}</span></td>
                </template>

                <template v-if="activeTab === 'subjects'">
                  <td class="px-6 py-4"><span class="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-md text-xs font-bold">{{ item.mamh }}</span></td>
                  <td class="px-6 py-4 text-sm font-bold text-slate-800">{{ item.tenmh }}</td>
                  <td class="px-6 py-4 text-sm font-semibold text-slate-600">{{ item.sotietlt }} tiết</td>
                  <td class="px-6 py-4 text-sm font-semibold text-slate-600">{{ item.sotietth }} tiết</td>
                </template>

                <template v-if="activeTab === 'lops'">
                  <td class="px-6 py-4"><span class="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-xs font-bold">{{ item.malop || item.id }}</span></td>
                  <td class="px-6 py-4 text-sm font-bold text-slate-800">{{ item.tenlop || item.name }}</td>
                  <td class="px-6 py-4 text-sm text-slate-600">{{ item.makhoa || item.department }}</td>
                </template>

                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg">Sửa</button>
                    <button class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg">Xóa</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>