/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',    // 主色调：蓝色
        secondary: '#10B981',  // 成功色：绿色
        accent: '#2563EB',     // 强调色：深蓝色
        amber: '#F59E0B',      // 提示色：琥珀色
        error: '#EF4444',      // 错误色：红色
        light: '#F8FAFC',      // 浅色背景
        dark: '#1E293B',       // 深色文本
        original: '#6366F1',   // 单词按钮色：靛蓝色
        kana: '#EC4899',       // 假名按钮色：粉色
        edit: '#8B5CF6',       // 编辑按钮色：紫色
        // 差异对比颜色
        'diff-insert': '#dcfce7',  // 新增内容背景
        'diff-delete': '#fee2e2',  // 删除内容背景
        'diff-equal': '#f3f4f6'    // 相同内容背景
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

