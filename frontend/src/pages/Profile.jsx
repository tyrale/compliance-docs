import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { loginSuccess } from '../store/slices/authSlice';
import authService from '../services/authService';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await authService.updateProfile(profileData);
      dispatch(loginSuccess({ user: updatedUser, token: user.token }));
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const validatePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordChange()) return;

    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordSuccess(true);
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Error changing password');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Profile Information
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {updateSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Profile updated successfully
              </Alert>
            )}
            <Box component="form" onSubmit={handleUpdateProfile}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                    type="email"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{ mt: 2 }}
                  >
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Update Profile'
                    )}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Password Change */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Security
            </Typography>
            {passwordSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Password changed successfully
              </Alert>
            )}
            <Button
              variant="outlined"
              onClick={() => setIsChangingPassword(true)}
              sx={{ mt: 2 }}
            >
              Change Password
            </Button>

            <Dialog
              open={isChangingPassword}
              onClose={() => setIsChangingPassword(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>Change Password</DialogTitle>
              <DialogContent>
                {passwordError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {passwordError}
                  </Alert>
                )}
                <Box component="form" onSubmit={handleChangePassword}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    margin="normal"
                  />
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setIsChangingPassword(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleChangePassword}
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Change Password'}
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Grid>

        {/* Account Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Account Settings
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Account Type: {user?.role || 'User'}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Member Since:{' '}
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : 'N/A'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Last Login:{' '}
              {user?.lastLogin
                ? new Date(user.lastLogin).toLocaleDateString()
                : 'N/A'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
