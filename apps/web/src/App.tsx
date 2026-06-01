import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { HomePage } from '@/pages/Home'
import {
  AdminLogsPage,
  AdminLoginPage,
  AdminPage,
  AdminPendingFoodsPage,
  AdminPendingPeoplePage,
  FoodsPage,
  PartyPage,
  PeoplePage,
  QuickPage,
  SubmitFoodPage,
  SubmitPersonPage
} from '@/pages/CorePages'

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/party', element: <PartyPage /> },
      { path: '/quick', element: <QuickPage /> },
      { path: '/foods', element: <FoodsPage /> },
      { path: '/people', element: <PeoplePage /> },
      { path: '/submit-person', element: <SubmitPersonPage /> },
      { path: '/submit-food', element: <SubmitFoodPage /> },
      { path: '/admin/login', element: <AdminLoginPage /> },
      { path: '/admin', element: <AdminPage /> },
      { path: '/admin/people/pending', element: <AdminPendingPeoplePage /> },
      { path: '/admin/foods/pending', element: <AdminPendingFoodsPage /> },
      { path: '/admin/logs', element: <AdminLogsPage /> }
    ]
  }
])

export default function App() {
  return <RouterProvider router={router} />
}
