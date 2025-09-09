import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, User as UserIcon, GraduationCap, Calendar, MapPin } from 'lucide-react';

import { userService, User } from '../services/api';

export default function UsersApp() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    candidate_name: "",
    relation: "",
    parent_name: "",
    institute: "",
    course: "",
    division: "",
    marks_obtained: "",
    marks_total: "",
    date: "",
    place: ""
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.institute.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNew = () => {
    setEditingUser(null);
    setFormData({
      candidate_name: "",
      relation: "",
      parent_name: "",
      institute: "",
      course: "",
      division: "",
      marks_obtained: "",
      marks_total: "",
      date: "",
      place: ""
    });
    setOpen(true);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData(user);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await userService.deleteUser(id);
        setUsers(users.filter(user => user._id !== id));
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.candidate_name.trim()) {
      alert("Candidate name is required");
      return;
    }

    try {
      let updatedUser: User;
      if (editingUser && editingUser._id) {
        updatedUser = await userService.updateUser(editingUser._id, formData);
        setUsers(users.map(user => 
          user._id === editingUser._id ? updatedUser : user
        ));
      } else {
        updatedUser = await userService.createUser(formData);
        setUsers([...users, updatedUser]);
      }
      setOpen(false);
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const getPercentage = (obtained: string, total: string) => {
    const percentage = (parseInt(obtained) / parseInt(total)) * 100;
    return isNaN(percentage) ? 0 : Math.round(percentage);
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600 bg-green-50";
    if (percentage >= 80) return "text-blue-600 bg-blue-50";
    if (percentage >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Management System</h1>
              <p className="text-gray-600 mt-1">Manage student records and academic performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-blue-700 font-semibold">{users.length}</span>
                <span className="text-blue-600 text-sm ml-1">Total Students</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <button
              onClick={handleNew}
              className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Student
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              <span className="ml-3 text-gray-600">Loading students...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No students found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student Info</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Academic Details</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Performance</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location & Date</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const percentage = getPercentage(user.marks_obtained, user.marks_total);
                    return (
                      <tr key={user._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900">{user.candidate_name}</div>
                            <div className="text-sm text-gray-600">
                              {user.relation} • Parent: {user.parent_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-2">
                            <GraduationCap className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-gray-900">{user.course}</div>
                              <div className="text-sm text-gray-600">{user.institute}</div>
                              <div className="text-xs text-gray-500 mt-1">Division {user.division}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900">
                                {user.marks_obtained}/{user.marks_total}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGradeColor(percentage)}`}>
                                {percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                                style={{width: `${Math.min(percentage, 100)}%`}}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                              {user.place}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                              {new Date(user.date).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                              title="Edit Student"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => user._id && handleDelete(user._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                              title="Delete Student"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
              <div className="px-6 py-5 border-b bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingUser ? "Edit Student" : "Add New Student"}
                </h2>
                <p className="text-gray-600 mt-1">
                  {editingUser ? "Update student information" : "Enter student details below"}
                </p>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { key: "candidate_name", label: "Candidate Name", required: true },
                    { key: "relation", label: "Relation" },
                    { key: "parent_name", label: "Parent Name" },
                    { key: "institute", label: "Institute" },
                    { key: "course", label: "Course" },
                    { key: "division", label: "Division" },
                    { key: "marks_obtained", label: "Marks Obtained", type: "number" },
                    { key: "marks_total", label: "Total Marks", type: "number" },
                    { key: "date", label: "Date", type: "date" },
                    { key: "place", label: "Place" }
                  ].map((field) => (
                    <div key={field.key} className={field.key === "candidate_name" ? "md:col-span-2" : ""}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        name={field.key}
                        type={field.type || "text"}
                        value={(formData as any)[field.key]}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
                <button
                  onClick={() => setOpen(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingUser ? "Update Student" : "Add Student"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}