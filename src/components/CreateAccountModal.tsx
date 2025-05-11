import { useState } from "react";
import { toast } from "react-hot-toast";
import { IoPersonAdd } from "react-icons/io5";
import { WorkerRole } from "../types/worker";
import { checkEmailExists, createWorker } from "../lib/supabase";

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableRoles: WorkerRole[];
  onSuccess: () => void;
}

function CreateAccountModal({
  isOpen,
  onClose,
  availableRoles,
  onSuccess,
}: CreateAccountModalProps) {
  const generateRandomPassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomChars = "";
    for (let i = 0; i < 6; i++) {
      randomChars += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `pass-${randomChars}`;
  };

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    contact_number: "",
    address: "",
    password: generateRandomPassword(),
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim())
      newErrors.first_name = "First name is required";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last name is required";

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      toast.error("Please enter a valid email address");
    }

    // Check if email already exists
    if (formData.email && emailRegex.test(formData.email) && !newErrors.email) {
      setIsProcessing(true);
      try {
        const result = await checkEmailExists(formData.email);
        if (result.success && result.data) {
          newErrors.email = "This email is already in use";
          toast.error("This email is already in use");
        }
      } catch (error) {
        console.error("Error checking email:", error);
      } finally {
        setIsProcessing(false);
      }
    }
    // Phone number validation
    const phoneRegex = /^(09|\+639)\d{9}$/;
    if (formData.contact_number && !phoneRegex.test(formData.contact_number)) {
      newErrors.contact_number =
        "Please enter a valid Philippine phone number (e.g., 09XXXXXXXXX or +639XXXXXXXXX)";
    }

    // Role validation
    if (selectedRoles.length === 0) {
      newErrors.roles = "Please select at least one role";
      toast.error("Please select at least one role");
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    return isValid;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (roleId: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationResult = await validateForm();
    if (validationResult === false) {
      return;
    } else {
      setIsProcessing(true);

      try {
        const result = await createWorker({
          first_name: formData.first_name,
          middle_name: formData.middle_name || null,
          last_name: formData.last_name,
          email: formData.email,
          contact_number: formData.contact_number || null,
          address: formData.address || null,
          password: formData.password,
          role_ids: selectedRoles,
        });

        if (result.success) {
          toast.success("Account created successfully");
          resetForm();
          onSuccess();
          onClose();
        } else {
          toast.error(result.error?.message || "Failed to create account");
        }
      } catch (error) {
        console.error("Error creating account:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setIsProcessing(false);
      }
    }
  };
  const resetForm = () => {
    setFormData({
      first_name: "",
      middle_name: "",
      last_name: "",
      email: "",
      contact_number: "",
      address: "",
      password: generateRandomPassword(),
    });
    setSelectedRoles([]);
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <IoPersonAdd /> Create New Account
            </h2>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  placeholder="e.g. Juan"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.first_name ? "border-red-500" : "border-gray-300"
                  } rounded-md`}
                />
                {errors.first_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.first_name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  name="middle_name"
                  placeholder="e.g. Lawrence"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  placeholder="e.g. Dela Pena"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.last_name ? "border-red-500" : "border-gray-300"
                  } rounded-md`}
                />
                {errors.last_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.last_name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. juandelapena@gmail.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } rounded-md`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  name="contact_number"
                  placeholder="e.g. 09XXXXXXXXX"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.contact_number ? "border-red-500" : "border-gray-300"
                  } rounded-md`}
                />
                {errors.contact_number && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.contact_number}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        password: generateRandomPassword(),
                      }))
                    }
                    className="ml-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  Automatic password will be generated. User must change it upon
                  first login.
                </p>
              </div>
              <div className="col-span-2">
                <label className="block text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  placeholder="e.g. 123 Main St, Barangay Example, City"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                ></textarea>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Roles</h3>
              <div className="grid grid-cols-3 gap-3">
                {availableRoles.map((role) => (
                  <div key={role.role_id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`new-role-${role.role_id}`}
                      checked={selectedRoles.includes(role.role_id)}
                      onChange={() => handleRoleChange(role.role_id)}
                      className="mr-2 h-5 w-5"
                    />
                    <label
                      htmlFor={`new-role-${role.role_id}`}
                      className="select-none"
                    >
                      {role.role_name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className={`px-4 py-2 bg-primary text-white rounded-md ${
                  isProcessing
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-red-700"
                }`}
              >
                {isProcessing ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateAccountModal;
