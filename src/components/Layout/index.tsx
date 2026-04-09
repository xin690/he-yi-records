import { NavLink, Outlet } from 'react-router-dom'
import { BookOpen, BarChart3, Import, Settings } from 'lucide-react'

const navItems = [
  { to: '/home', icon: BookOpen, label: '账本' },
  { to: '/stats', icon: BarChart3, label: '统计' },
  { to: '/import', icon: Import, label: '导入' },
  { to: '/settings', icon: Settings, label: '我的' },
]

export function Layout() {
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 overflow-auto pb-20 p-4">
        <Outlet />
      </main>
      <nav className="h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around fixed bottom-0 left-0 right-0 safe-area-bottom">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-4 py-2 transition-colors ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}