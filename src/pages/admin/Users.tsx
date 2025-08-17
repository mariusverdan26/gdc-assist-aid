import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Eye, EyeOff, Filter, Pencil, Plus, Search, Trash2, Upload, UserIcon } from "lucide-react";


interface User {
  id: string;
  employeeID: string;
  name: string;
  role: string;
  password?: string;
}

export default function UsersScreen() {
  const [showPassword, setShowPassword] = useState(false);
  // Batch add state
  const [csvError, setCsvError] = useState<string>("");
  const [csvLoading, setCsvLoading] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // CSV parsing and batch add logic
  const handleCSVUpload = async (fileOrEvent: File | React.ChangeEvent<HTMLInputElement>) => {
    setCsvError("");
    let file: File | null = null;
    if (fileOrEvent instanceof File) {
      file = fileOrEvent;
    } else {
      file = fileOrEvent.target.files?.[0] || csvFile;
    }
    if (!file) return;
    setCsvLoading(true);
    try {
      const text = await file.text();
      // Simple CSV parse: employeeID,name,role,password
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) throw new Error("CSV must have a header and at least one row");
      const header = lines[0].split(",").map(h => h.trim().toLowerCase());
      const required = ["employeeid", "name", "role", "password"];
      if (!required.every(r => header.includes(r))) throw new Error("CSV must have columns: employeeID, name, role, password");
      const idx = (col: string) => header.indexOf(col);
      const usersToAdd = lines.slice(1).map(line => {
        const cols = line.split(",");
        return {
          employeeID: cols[idx("employeeid")].trim(),
          name: cols[idx("name")].trim(),
          role: cols[idx("role")].trim(),
          password: cols[idx("password")].trim(),
        };
      });
      // Validate
      if (usersToAdd.some(u => !u.employeeID || !u.name || !u.role || !u.password)) {
        throw new Error("All fields are required in every row");
      }
      // Batch add
      const batch = usersToAdd.map(u => addDoc(collection(db, "users"), u));
      await Promise.all(batch);
      fetchUsers();
      toast.success(`Batch added ${usersToAdd.length} users!`);
      setBatchDialogOpen(false);
      setCsvFile(null);
    } catch (err: any) {
      setCsvError(err.message || "Failed to process CSV");
      toast.error(err.message || "Failed to process CSV");
    } finally {
      setCsvLoading(false);
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ employeeID: "", name: "", role: "employee", password: "" });
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
    setForm({ employeeID: "", name: "", role: "employee", password: "" });
    setEditingUser(null);
    setOpen(false);
    fetchUsers();
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setForm({ employeeID: user.employeeID, name: user.name, role: user.role, password: user.password || "" });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "users", id));
    fetchUsers();
  };

  // Filtered users based on search and role
  const filteredUsers = users.filter(user => {
    const empId = user.employeeID || "";
    const name = user.name || "";
    const matchesSearch =
      searchTerm === "" ||
      empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex flex-1 gap-2 md:justify-end">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by employee ID or name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-36">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" /> Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setEditingUser(null); setForm({ employeeID: "", name: "", role: "employee", password: "" }); setOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add User
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBatchDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" /> Batch Add (CSV)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Batch Add Dialog */}
        <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Batch Add Users (CSV)</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 items-center">
              <div className="w-full text-sm text-muted-foreground mb-2">
                <p>Upload a CSV file with columns: <b>employeeID, name, role, password</b></p>
                <p className="mt-1">Example:</p>
                <pre className="bg-gray-100 rounded p-2 text-xs mt-1">employeeID,name,role,password
1234,John Doe,employee,pass123
5678,Jane Smith,admin,adminpass</pre>
              </div>
              <label className="w-full flex flex-col items-center px-4 py-8 bg-green-50 border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                <Upload className="w-8 h-8 mb-2 text-green-700" />
                <span className="text-green-800 font-medium">Drag & drop or click to select CSV file</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  disabled={csvLoading}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setCsvFile(file);
                  }}
                />
              </label>
              {csvFile && (
                <div className="w-full flex items-center justify-between mt-2">
                  <span className="text-xs text-green-900">{csvFile.name}</span>
                  <Button size="sm" variant="outline" onClick={() => setCsvFile(null)}>Remove</Button>
                </div>
              )}
              {csvError && <div className="text-red-600 text-xs mt-1">{csvError}</div>}
              <Button
                className="w-full mt-2"
                disabled={!csvFile || csvLoading}
                onClick={() => csvFile && handleCSVUpload(csvFile)}
              >
                {csvLoading ? "Uploading..." : "Upload & Add Users"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
        {csvError && <div className="text-red-600 text-xs mt-1">{csvError}</div>}
        {csvLoading && <div className="text-green-700 text-xs mt-1">Uploading...</div>}
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
            <div className="relative w-full">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="border p-2 rounded w-full pr-12"
                required={!editingUser}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-700"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{ background: 'none', border: 'none', outline: 'none' }}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <DialogFooter className="flex gap-2 mt-2">
              <Button type="submit">{editingUser ? "Update User" : "Add User"}</Button>
              <Button type="button" variant="secondary" onClick={() => { setEditingUser(null); setForm({ employeeID: "", name: "", role: "employee", password: "" }); setOpen(false); }}>Cancel</Button>
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
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
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
