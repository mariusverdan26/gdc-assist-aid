import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface User {
  id: string;
  employeeID: string;
  name: string;
  role: string;
}

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ employeeID: "", name: "", role: "employee" });
  const [open, setOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "users"));
    const usersData: User[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
    setUsers(usersData);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      // Update
      await updateDoc(doc(db, "users", editingUser.id), form);
    } else {
      // Create
      await addDoc(collection(db, "users"), form);
    }
    setForm({ employeeID: "", name: "", role: "employee" });
    setEditingUser(null);
    setOpen(false);
    fetchUsers();
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setForm({ employeeID: user.employeeID, name: user.name, role: user.role });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "users", id));
    fetchUsers();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={() => { setEditingUser(null); setForm({ employeeID: "", name: "", role: "employee" }); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              name="employeeID"
              placeholder="Employee ID"
              value={form.employeeID}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
            <input
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="border p-2 rounded"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
            <DialogFooter className="flex gap-2 mt-2">
              <Button type="submit">{editingUser ? "Update User" : "Add User"}</Button>
              <Button type="button" variant="secondary" onClick={() => { setEditingUser(null); setForm({ employeeID: "", name: "", role: "employee" }); setOpen(false); }}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-2xl shadow border-4 border-sidebar-border overflow-hidden">
            <thead>
              <tr className="bg-gradient-to-r from-green-100 to-green-200 text-gray-700">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider rounded-tl-2xl">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">No users found.</td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr
                    key={user.id}
                    className={
                      `transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50`
                    }
                  >
                    <td className="px-6 py-3 whitespace-nowrap font-mono text-sm text-gray-700">{user.employeeID}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-gray-800">{user.name}</td>
                    <td className="px-6 py-3 whitespace-nowrap capitalize text-gray-600">{user.role}</td>
                    <td className="px-6 py-3 space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                        <Pencil className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
