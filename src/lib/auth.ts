const USERS = [
  { username: 'jorden', password: 'jorden123', name: 'Jorden' },
  { username: 'halie', password: 'halie123', name: 'Halie' },
]

export function validateUser(username: string, password: string) {
  return USERS.find(u => u.username === username && u.password === password) || null
}
