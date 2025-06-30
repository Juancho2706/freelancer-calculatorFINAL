'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AuthModal from './AuthModal';
import { User } from '@supabase/supabase-js';
import { useTheme } from '@/contexts/ThemeProvider';

export default function Header() {
  return null;
} 