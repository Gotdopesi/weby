/**
 * Formulář poptávky — odeslání do Supabase (REST API + fetch)
 *
 * V Supabase vytvořte tabulku např.:
 *   create table public.poptavky (
 *     id uuid primary key default gen_random_uuid(),
 *     created_at timestamptz not null default now(),
 *     company text not null,
 *     email text not null,
 *     field text not null,
 *     purpose text not null,
 *     other_purpose text,
 *     style text,
 *     other_style text,
 *     description text
 *   );
 *   alter table public.poptavky enable row level security;
 *   create policy "anon insert poptavky" on public.poptavky for insert to anon with check (true);
 */

// ▼▼▼ Doplňte z Supabase: Project Settings → API ▼▼▼
// URL může být buď https://….supabase.co nebo omylem s /rest/v1 na konci — obojí projde.
function normalizeSupabaseBaseUrl(raw) {
    var u = String(raw || '').trim().replace(/\/+$/, '');
    if (!u) return '';
    u = u.replace(/\/rest\/v1\/?$/i, '');
    return u.replace(/\/+$/, '');
}
const SUPABASE_URL = normalizeSupabaseBaseUrl('https://VÁŠ_PROJECT_REF.supabase.co');
const SUPABASE_ANON_KEY = 'VÁŠ_ANON_PUBLIC_KEY';
// ▲▲▲ -----------------------------------------------------------------

const POPTAVKY_ENDPOINT = SUPABASE_URL
    ? SUPABASE_URL + '/rest/v1/poptavky'
    : '';

/**
 * Funkce pro zobrazení polí "Jiné" (globální pro HTML)
 */
window.toggleOtherPurpose = function(val) {
    const wrapper = document.getElementById('otherPurposeWrapper');
    const input = document.getElementById('otherPurpose');
    if (wrapper && input) {
        if (val === 'jine') {
            wrapper.style.display = 'block';
            input.required = true;
        } else {
            wrapper.style.display = 'none';
            input.required = false;
            input.value = '';
            clearError(input);
        }
    }
};

window.toggleOtherStyle = function(val) {
    const wrapper = document.getElementById('otherStyleWrapper');
    const input = document.getElementById('otherStyle');
    if (wrapper && input) {
        if (val === 'jiny_styl') {
            wrapper.style.display = 'block';
            input.required = true;
        } else {
            wrapper.style.display = 'none';
            input.required = false;
            input.value = '';
            clearError(input);
        }
    }
};

window.closeModal = function() {
    const modal = document.getElementById('successModal');
    if (modal) modal.classList.remove('show');
    window.location.href = 'index.html';
};

function showError(field, message) {
    const group = field.closest('.form-group');
    if (!group) return;

    let bubble = group.querySelector('.validation-bubble');
    if (bubble) {
        bubble.querySelector('.bubble-text').textContent = message;
        return;
    }

    field.classList.add('is-invalid');

    bubble = document.createElement('div');
    bubble.className = 'validation-bubble';
    bubble.innerHTML = `
        <div class="bubble-icon">!</div>
        <span class="bubble-text">${message}</span>
    `;

    group.appendChild(bubble);

    const removeHandler = () => {
        clearError(field);
        field.removeEventListener('input', removeHandler);
        field.removeEventListener('change', removeHandler);
    };
    field.addEventListener('input', removeHandler);
    field.addEventListener('change', removeHandler);
}

function clearError(field) {
    const group = field.closest('.form-group');
    if (!group) return;

    field.classList.remove('is-invalid');
    const bubble = group.querySelector('.validation-bubble');
    if (bubble) {
        bubble.remove();
    }
}

function buildSupabaseRow(formDataObj) {
    return {
        company: formDataObj.company.trim(),
        email: formDataObj.email.trim(),
        field: formDataObj.field.trim(),
        purpose: formDataObj.purpose.trim(),
        other_purpose: (formDataObj.otherPurpose && String(formDataObj.otherPurpose).trim()) || null,
        style: (formDataObj.style && String(formDataObj.style).trim()) || null,
        other_style: (formDataObj.otherStyle && String(formDataObj.otherStyle).trim()) || null,
        description: (formDataObj.description && String(formDataObj.description).trim()) || null,
    };
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('poptavkaForm');
    const submitBtn = document.getElementById('submitBtn');
    const modal = document.getElementById('successModal');

    if (!form) return;

    form.setAttribute('novalidate', true);

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        const emailInput = document.getElementById('email');
        let isValid = true;
        let firstInvalid = null;

        form.querySelectorAll('.validation-bubble').forEach(b => b.remove());
        form.querySelectorAll('.is-invalid').forEach(i => i.classList.remove('is-invalid'));

        inputs.forEach(input => {
            if (!input.value.trim() && (input.offsetParent !== null)) {
                isValid = false;
                showError(input, 'Vyplňte prosím toto pole.');
                if (!firstInvalid) firstInvalid = input;
            }
        });

        if (emailInput && emailInput.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value.trim())) {
                isValid = false;
                showError(emailInput, 'Zadejte platnou emailovou adresu');
                if (!firstInvalid) firstInvalid = emailInput;
            }
        }

        if (!isValid) {
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalid.focus();
            }
            return;
        }

        const raw = Object.fromEntries(new FormData(form).entries());

        if (raw.nickname && String(raw.nickname).trim() !== '') {
            if (modal) modal.classList.add('show');
            form.reset();
            return;
        }

        if (
            !SUPABASE_URL ||
            !POPTAVKY_ENDPOINT ||
            SUPABASE_URL.includes('VÁŠ_PROJECT_REF') ||
            !SUPABASE_ANON_KEY ||
            SUPABASE_ANON_KEY.includes('VÁŠ_ANON')
        ) {
            alert('V souboru poptavka.js ještě doplňte konstanty SUPABASE_URL a SUPABASE_ANON_KEY.');
            return;
        }

        const row = buildSupabaseRow(raw);

        submitBtn.textContent = 'Odesílám...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(POPTAVKY_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                    Prefer: 'return=minimal',
                },
                body: JSON.stringify(row),
            });

            if (response.ok) {
                if (modal) modal.classList.add('show');
                form.reset();
                const purposeSel = document.getElementById('purpose');
                const styleSel = document.getElementById('style');
                if (purposeSel) {
                    purposeSel.selectedIndex = 0;
                    window.toggleOtherPurpose('');
                }
                if (styleSel) {
                    styleSel.value = 'minimal';
                    window.toggleOtherStyle('minimal');
                }
            } else {
                let detail = response.statusText;
                try {
                    const errBody = await response.json();
                    if (errBody && (errBody.message || errBody.error || errBody.hint)) {
                        detail = [errBody.message, errBody.hint, errBody.details].filter(Boolean).join(' — ');
                    }
                } catch (_) { /* ignore */ }
                console.error('Supabase error:', response.status, detail);
                alert('Chyba při odesílání. Zkuste to prosím později.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Něco se nepovedlo. Zkontrolujte připojení.');
        } finally {
            submitBtn.textContent = 'Odeslat nezávaznou poptávku';
            submitBtn.disabled = false;
        }
    });
});
