import Swal from 'sweetalert2';

// Nature-inspired SweetAlert2 theme matching Biodiversity design
export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

export const showSuccess = (title, text = '') => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonColor: '#1b3d2f',
    customClass: {
      popup: 'rounded-2xl shadow-2xl border border-forest/10',
      title: 'font-display font-bold text-forest',
      confirmButton: 'px-5 py-2.5 rounded-xl font-medium shadow-md'
    }
  });
};

export const showError = (title, text = '') => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#e11d48',
    customClass: {
      popup: 'rounded-2xl shadow-2xl border border-rose-100',
      title: 'font-display font-bold text-forest',
      confirmButton: 'px-5 py-2.5 rounded-xl font-medium shadow-md'
    }
  });
};

export const showWarning = (title, text = '') => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonColor: '#d97706',
    customClass: {
      popup: 'rounded-2xl shadow-2xl border border-amber-100',
      title: 'font-display font-bold text-forest',
      confirmButton: 'px-5 py-2.5 rounded-xl font-medium shadow-md'
    }
  });
};

export const confirmAction = async ({
  title = 'Are you sure?',
  text = 'This action cannot be undone.',
  confirmText = 'Yes, Proceed',
  cancelText = 'Cancel',
  icon = 'warning',
  confirmButtonColor = '#e11d48'
} = {}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor: '#64748b',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    customClass: {
      popup: 'rounded-2xl shadow-2xl border border-forest/10',
      title: 'font-display font-bold text-forest',
      confirmButton: 'px-5 py-2.5 rounded-xl font-medium shadow-md',
      cancelButton: 'px-5 py-2.5 rounded-xl font-medium'
    }
  });
  return result.isConfirmed;
};

export default Swal;

