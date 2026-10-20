import { Route, Switch } from 'wouter'
import Layout from './components/layout/Layout.tsx'
import RequireAuth from './components/require-auth/RequireAuth.tsx'
import { ROLES } from './config/auth.ts'
import DashboardPage from './pages/dashboard/DashboardPage.tsx'
import HomePage from './pages/home/HomePage.tsx'
import UsersPage from './pages/users/UsersPage.tsx'
import LoginPage from './pages/login/LoginPage.tsx'

export default function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/dashboard">
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        </Route>
        <Route path="/users">
          <RequireAuth roles={[ROLES.admin]}>
            <UsersPage />
          </RequireAuth>
        </Route>
        <Route>404: página no encontrada.</Route>
      </Switch>
    </Layout>
  )
}
