import * as THREE from 'three';

export function fixBackgroundSize(backgroundTexture: THREE.Texture) {
    const texture = backgroundTexture;
    if (texture && texture.image) {
        const image = texture.image as { width: number, height: number };
        
        const container = document.getElementById('game-view');
        const width = container ? container.clientWidth : window.innerWidth;
        const height = container ? container.clientHeight : window.innerHeight;
        
        const windowAspect = width / height;
        const imageAspect = image.width / image.height;
        const aspect = imageAspect / windowAspect;

        if (windowAspect > imageAspect) {
             texture.repeat.set(1, aspect);
             texture.offset.set(0, (1 - aspect) / 2);
        } else {
             texture.repeat.set(1 / aspect, 1);
             texture.offset.set((1 - 1 / aspect) / 2, 0);
        }
    }
}

export function setupAlertModal() {
    const modal = document.getElementById('alert-modal');
    const closeBtn = document.getElementById('close-alert-modal');
    const okBtn = document.getElementById('btn-alert-ok');

    if (!modal) return;

    const closeModal = () => {
        modal.style.display = 'none';
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (okBtn) okBtn.onclick = closeModal;
    
    // Close on outside click
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
}

export function showCustomAlert(message: string, title: string = 'Safe Solver') {
    const modal = document.getElementById('alert-modal');
    const titleEl = document.getElementById('alert-title');
    const msgEl = document.getElementById('alert-message');

    if (modal && titleEl && msgEl) {
        titleEl.innerText = title;
        msgEl.innerText = message;
        modal.style.display = 'block';
    } else {
        // Fallback if modal is missing (e.g. before init or HTML error)
        alert(message);
    }
}

export function showToast(message: string, duration: number = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Trigger reflow for animation
    void toast.offsetHeight;
    
    toast.classList.add('show');

    const removeToast = () => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (container && container.contains(toast)) {
                container.removeChild(toast);
            }
            // Remove container if empty? Maybe not necessary
        }, 300);
    };

    let timer: any;
    if (duration > 0) {
        timer = setTimeout(removeToast, duration);
    }

    return {
        updateMessage: (msg: string) => {
            toast.textContent = msg;
        },
        close: () => {
            if (timer) clearTimeout(timer);
            removeToast();
        }
    }
}
