import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FilterBar from "@/components/FilterBar";
import StoreCard from "@/components/StoreCard";
import { Users, Store as StoreIcon, Star, Plus, Loader2 } from "lucide-react";
import { z } from "zod";

interface AdminDashboardProps {
  userId: string;
}

const userSchema = z.object({
  name: z.string().trim().min(20).max(60),
  email: z.string().trim().email(),
  address: z.string().trim().max(400),
  password: z.string()
    .min(8)
    .max(16)
    .regex(/[A-Z]/)
    .regex(/[!@#$%^&*(),.?":{}|<>]/),
  role: z.enum(['admin', 'user', 'owner']),
});

const storeSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  address: z.string().trim().min(1),
  owner_id: z.string().optional(),
});

const AdminDashboard = ({ userId }: AdminDashboardProps) => {
  const { toast } = useToast();
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [filteredStores, setFilteredStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", address: "", password: "", role: "user" });
  const [newStore, setNewStore] = useState({ name: "", email: "", address: "", owner_id: "" });
  const [owners, setOwners] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [userSearch, users]);

  useEffect(() => {
    filterStores();
  }, [storeSearch, stores]);

  const fetchData = async () => {
    setLoading(true);

    const [usersRes, storesRes, ratingsRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('stores').select('*'),
      supabase.from('ratings').select('*'),
    ]);

    if (usersRes.error || storesRes.error || ratingsRes.error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const storesWithRatings = storesRes.data.map(store => {
      const storeRatings = ratingsRes.data.filter(r => r.store_id === store.id);
      const averageRating = storeRatings.length > 0
        ? storeRatings.reduce((sum, r) => sum + r.rating, 0) / storeRatings.length
        : 0;

      return {
        ...store,
        averageRating,
      };
    });

    setUsers(usersRes.data);
    setStores(storesWithRatings);
    setOwners(usersRes.data.filter(u => u.role === 'owner'));
    setStats({
      totalUsers: usersRes.data.length,
      totalStores: storesRes.data.length,
      totalRatings: ratingsRes.data.length,
    });
    setLoading(false);
  };

  const filterUsers = () => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.address.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.role.toLowerCase().includes(userSearch.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const filterStores = () => {
    const filtered = stores.filter(store =>
      store.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      store.address.toLowerCase().includes(storeSearch.toLowerCase()) ||
      (store.email && store.email.toLowerCase().includes(storeSearch.toLowerCase()))
    );
    setFilteredStores(filtered);
  };

  const handleAddUser = async () => {
    const validation = userSchema.safeParse(newUser);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
      options: {
        data: {
          name: newUser.name,
          address: newUser.address,
          role: newUser.role,
        },
      },
    });

    if (authError) {
      toast({
        title: "Error",
        description: authError.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "User Created",
      description: `${newUser.name} has been added successfully`,
    });

    setIsAddUserOpen(false);
    setNewUser({ name: "", email: "", address: "", password: "", role: "user" });
    fetchData();
  };

  const handleAddStore = async () => {
    const validation = storeSchema.safeParse(newStore);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from('stores').insert({
      name: newStore.name,
      email: newStore.email,
      address: newStore.address,
      owner_id: newStore.owner_id || null,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Store Created",
      description: `${newStore.name} has been added successfully`,
    });

    setIsAddStoreOpen(false);
    setNewStore({ name: "", email: "", address: "", owner_id: "" });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage users, stores, and view analytics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-elegant hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
            <StoreIcon className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStores}</div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
            <Star className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRatings}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-elegant">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users Management</CardTitle>
              <CardDescription>View and manage all users</CardDescription>
            </div>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Create a new user account with any role</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name (20-60 chars)</Label>
                    <Input
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address (max 400 chars)</Label>
                    <Input
                      value={newUser.address}
                      onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                      placeholder="Enter address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password (8-16 chars, 1 uppercase, 1 special)</Label>
                    <Input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="owner">Store Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
                  <Button variant="gradient" onClick={handleAddUser}>Create User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            searchTerm={userSearch}
            onSearchChange={setUserSearch}
            placeholder="Search users..."
          />
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="max-w-xs truncate">{user.address}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary capitalize">
                        {user.role}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-elegant">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stores Management</CardTitle>
              <CardDescription>View and manage all stores</CardDescription>
            </div>
            <Dialog open={isAddStoreOpen} onOpenChange={setIsAddStoreOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Store
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Store</DialogTitle>
                  <DialogDescription>Create a new store listing</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Store Name</Label>
                    <Input
                      value={newStore.name}
                      onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                      placeholder="Enter store name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newStore.email}
                      onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                      placeholder="store@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={newStore.address}
                      onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                      placeholder="Enter store address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Owner (Optional)</Label>
                    <Select value={newStore.owner_id} onValueChange={(value) => setNewStore({ ...newStore, owner_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Owner</SelectItem>
                        {owners.map((owner) => (
                          <SelectItem key={owner.id} value={owner.id}>
                            {owner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddStoreOpen(false)}>Cancel</Button>
                  <Button variant="gradient" onClick={handleAddStore}>Create Store</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            searchTerm={storeSearch}
            onSearchChange={setStoreSearch}
            placeholder="Search stores..."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => (
              <StoreCard
                key={store.id}
                store={{
                  id: store.id,
                  name: store.name,
                  address: store.address,
                  email: store.email,
                  averageRating: store.averageRating,
                }}
                isAdmin={true}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
