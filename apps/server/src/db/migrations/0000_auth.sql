-- Authentication Migration

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE public.user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_onboarding');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'positions_enum') THEN
        CREATE TYPE public.positions_enum AS ENUM ('admin', 'owner', 'managers', 'staff');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'modules_enum') THEN
        CREATE TYPE public.modules_enum AS ENUM (
            'HR & Workforce',
            'HR Payroll',
            'Inventory',
            'Production',
            'Sales',
            'Finance & Accounting'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_code_type') THEN
        CREATE TYPE public.verification_code_type AS ENUM ('email_verify', 'password_reset', 'mfa_login');
    END IF;
END$$;

-- Organizations / Tenants table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    tenant_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    status public.user_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- UserRoles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    position public.positions_enum NOT NULL DEFAULT 'staff',
    module TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- VerificationCodes table
CREATE TABLE IF NOT EXISTS public.verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
