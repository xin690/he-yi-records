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
    <div className="h-full flex flex-col">
      <nav className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-2">
        <div className="text-lg font-semibold text-primary-600 mr-4">合一记账</div>
        <div className="flex gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}