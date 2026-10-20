import { roleLabel } from './UserCard.utils.ts'
import styles from './UserCard.module.css'

export default function UserCard({
  email,
  role,
}: {
  email: string
  role: string
}) {
  return (
    <article className={styles.card}>
      <p className={styles.email}>{email}</p>
      <span className={styles.badge}>{roleLabel(role)}</span>
    </article>
  )
}
