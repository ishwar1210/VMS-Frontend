import { useState, useEffect } from "react";
import { endpoints } from "../api/endpoint";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ComponentAccessManagement.css";

export default function ComponentAccessManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [selectedComponents, setSelectedComponents] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchComponents();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await endpoints.user.getAll();
      const data = res?.data || [];
      const list = data?.$values || data?.data || data;
      if (Array.isArray(list)) setUsers(list);
      else setUsers([]);
    } catch (err) {
      toast.error("Failed to fetch users");
      setUsers([]);
    }
  };

  const fetchComponents = async () => {
    try {
      const res = await endpoints.component.getAll();
      const data = res?.data || [];
      const list = data?.$values || data?.data || data;
      if (Array.isArray(list)) {
        // Sort by DisplayOrder
        const sorted = list.sort((a: any, b: any) => {
          const orderA = a.displayOrder || a.DisplayOrder || 0;
          const orderB = b.displayOrder || b.DisplayOrder || 0;
          return orderA - orderB;
        });
        setComponents(sorted);
      } else {
        setComponents([]);
      }
    } catch (err) {
      toast.error("Failed to fetch components");
      setComponents([]);
    }
  };

  const fetchUserComponents = async (userId: number) => {
    try {
      const res = await endpoints.component.getUserComponents(userId);
      const data = res?.data || [];
      const userComps = data?.$values || data?.data || data;
      if (Array.isArray(userComps)) {
        const compIds = userComps.map(
          (c: any) => c.componentId || c.ComponentId
        );
        setSelectedComponents(compIds);
      } else {
        setSelectedComponents([]);
      }
    } catch (err) {
      toast.error("Failed to fetch user components");
      setSelectedComponents([]);
    }
  };

  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId);
    if (userId > 0) {
      fetchUserComponents(userId);
      const user = users.find((u) => {
        const id = u.userId || u.UserId || u.id;
        return Number(id) === userId;
      });
      if (user) {
        const name = user.userName || user.username || user.name || "";
        setUserSearchTerm(name);
      }
    } else {
      setSelectedComponents([]);
      setUserSearchTerm("");
    }
  };

  const handleComponentToggle = (componentId: number) => {
    setSelectedComponents((prev) =>
      prev.includes(componentId)
        ? prev.filter((id) => id !== componentId)
        : [...prev, componentId]
    );
  };

  const handleSelectAll = () => {
    const allIds = components.map((c) => c.componentId || c.ComponentId);
    setSelectedComponents(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedComponents([]);
  };

  const handleSave = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    setLoading(true);
    try {
      // Format data according to backend API
      const accesses = selectedComponents.map((componentId) => ({
        componentId: componentId,
        canView: true,
        canEdit: false,
        canDelete: false,
      }));

      await endpoints.component.assignComponents({
        userId: selectedUserId,
        accesses: accesses,
      });
      toast.success("Components assigned successfully!");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to assign components"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const name = user.userName || user.username || user.name || "";
    const email = user.email || user.Email || "";
    const search = userSearchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(search) ||
      email.toLowerCase().includes(search)
    );
  });

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="component-access-container">
        <div className="access-header">
          <h2>Component Access Management</h2>
          <p>Assign components/modules to users</p>
        </div>

        <div className="access-content">
          <div className="user-selection-card">
            <h3>Select User</h3>
            <div className="form-group">
              <label>Search User *</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="form-input"
              />
            </div>

            {userSearchTerm && (
              <div className="user-list">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const userId = user.userId || user.UserId || user.id;
                    const name =
                      user.userName || user.username || user.name || "Unknown";
                    const email = user.email || user.Email || "";
                    const role = user.roleName || user.RoleName || "";

                    return (
                      <div
                        key={userId}
                        className={`user-item ${
                          selectedUserId === userId ? "selected" : ""
                        }`}
                        onClick={() => handleUserSelect(Number(userId))}
                      >
                        <div className="user-info">
                          <div className="user-name">{name}</div>
                          <div className="user-email">{email}</div>
                          {role && <div className="user-role">{role}</div>}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-results">No users found</div>
                )}
              </div>
            )}
          </div>

          {selectedUserId > 0 && (
            <div className="components-card">
              <div className="components-header">
                <h3>Assign Components</h3>
                <div className="bulk-actions">
                  <button onClick={handleSelectAll} className="action-btn">
                    Select All
                  </button>
                  <button onClick={handleDeselectAll} className="action-btn">
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="components-list">
                {/* Parent menus without path */}
                {components
                  .filter((c) => {
                    const path = c.componentPath || c.ComponentPath;
                    const parentId = c.parentComponentId || c.ParentComponentId;
                    return !path && !parentId;
                  })
                  .map((parent) => {
                    const parentId = parent.componentId || parent.ComponentId;
                    const parentName =
                      parent.componentName || parent.ComponentName;

                    // Find children of this parent
                    const children = components.filter((c) => {
                      const childParentId =
                        c.parentComponentId || c.ParentComponentId;
                      return childParentId === parentId;
                    });

                    return (
                      <div key={parentId} className="component-group">
                        <h4>{parentName}</h4>
                        <div className="checkbox-grid">
                          {children.map((component) => {
                            const compId =
                              component.componentId || component.ComponentId;
                            const compName =
                              component.componentName ||
                              component.ComponentName;
                            const compIcon =
                              component.componentIcon ||
                              component.ComponentIcon;

                            return (
                              <label key={compId} className="checkbox-item">
                                <input
                                  type="checkbox"
                                  checked={selectedComponents.includes(compId)}
                                  onChange={() => handleComponentToggle(compId)}
                                />
                                <span className="component-label">
                                  {compIcon && <i className={compIcon}></i>}
                                  {compName}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                {/* Components without parent (standalone) */}
                {components.filter((c) => {
                  const path = c.componentPath || c.ComponentPath;
                  const parentId = c.parentComponentId || c.ParentComponentId;
                  return path && !parentId;
                }).length > 0 && (
                  <div className="component-group">
                    <h4>Main Components</h4>
                    <div className="checkbox-grid">
                      {components
                        .filter((c) => {
                          const path = c.componentPath || c.ComponentPath;
                          const parentId =
                            c.parentComponentId || c.ParentComponentId;
                          return path && !parentId;
                        })
                        .map((component) => {
                          const compId =
                            component.componentId || component.ComponentId;
                          const compName =
                            component.componentName || component.ComponentName;
                          const compIcon =
                            component.componentIcon || component.ComponentIcon;

                          return (
                            <label key={compId} className="checkbox-item">
                              <input
                                type="checkbox"
                                checked={selectedComponents.includes(compId)}
                                onChange={() => handleComponentToggle(compId)}
                              />
                              <span className="component-label">
                                {compIcon && <i className={compIcon}></i>}
                                {compName}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              <div className="save-section">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="save-btn"
                >
                  {loading ? "Saving..." : "Save Access"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
