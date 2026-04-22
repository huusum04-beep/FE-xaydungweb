<template>
  <div class="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-500 to-indigo-700 p-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all">
      
      <div class="p-8 pb-0 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
        <h2 class="text-3xl font-extrabold text-gray-800 tracking-tight">
          {{ isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới' }}
        </h2>
        <p class="text-gray-500 mt-2">Hệ thống Quản lý Sinh viên STU</p>
      </div>

      <div class="p-8">
        <form @submit.prevent="handleAuth" class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Tên đăng nhập</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input 
                v-model="form.username" 
                type="text" 
                placeholder="Nhập username..."
                class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150" 
                required
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input 
                v-model="form.password" 
                type="password" 
                placeholder="••••••••"
                class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150" 
                required
              >
            </div>
          </div>

          <button 
  type="submit" 
  :disabled="isLoading"
  class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed"
>
  <span v-if="isLoading" class="flex items-center gap-2">
    <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    ĐANG XỬ LÝ...
  </span>
  <span v-else>
    {{ isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ' }}
  </span>
</button>
        </form>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200"></div></div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">Hoặc</span>
            </div>
          </div>

          <button 
            @click="isLogin = !isLogin" 
            class="mt-4 w-full flex justify-center py-2 px-4 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            {{ isLogin ? 'Chưa có tài khoản? Tạo ngay' : 'Đã có tài khoản? Quay lại đăng nhập' }}
          </button>
        </div>
      </div>

      <div class="bg-gray-50 p-4 text-center border-t border-gray-100 text-xs text-gray-400 uppercase tracking-widest font-semibold">
        Design by Sum Pham
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { authAPI, studentAPI } from './api'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLogin = ref(true)
const isLoading = ref(false) // Thêm biến trạng thái loading
const form = reactive({ username: '', password: '' })

async function handleAuth() {
  isLoading.value = true; // Bắt đầu loading khi bấm nút
  
  try {
    const res = isLogin.value ? await authAPI.login(form) : await authAPI.register(form)
    
    let userData = res.user || res;
    localStorage.setItem('user', JSON.stringify(userData));

    const role = (userData.role || userData.Role || '').toLowerCase();
    const isAdmin = role === 'admin' || userData.isAdmin === true;

    if (isAdmin) {
      router.push('/admin');
    } else {
      try {
        const profile = await studentAPI.getProfile();
        userData = { ...userData, ...profile };
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (profileErr) {
        console.warn("Lỗi profile:", profileErr.message);
      }
      router.push('/user');
    }
    
  } catch (err) {
    alert("Thất bại: " + err.message)
  } finally {
    isLoading.value = false; // Tắt loading dù thành công hay thất bại
  }
}
</script>