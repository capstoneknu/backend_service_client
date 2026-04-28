import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {useAuthStore} from '../store/authStore';

const LoginScreen = ({navigation}) => {
  const {login, isLoading, error, clearError} = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const passwordRef = useRef(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // 입력 유효성 검사
  const validate = () => {
    if (!email.trim()) {
      setLocalError('이메일을 입력해주세요.');
      triggerShake();
      return false;
    }
    if (!email.includes('@')) {
      setLocalError('올바른 이메일 형식이 아닙니다.');
      triggerShake();
      return false;
    }
    if (!password) {
      setLocalError('비밀번호를 입력해주세요.');
      triggerShake();
      return false;
    }
    setLocalError('');
    return true;
  };

  // 에러 시 흔들림 애니메이션
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {toValue: 10, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -10, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 8, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -8, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 0, duration: 50, useNativeDriver: true}),
    ]).start();
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) return;

    const result = await login(email, password);
    if (!result.success) {
      triggerShake();
    }
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* 상단 로고 영역 */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🌿</Text>
          </View>
          <Text style={styles.appName}>에너지 대시보드</Text>
          <Text style={styles.appTagline}>
            스마트한 에너지 절약, 함께 시작해요
          </Text>
        </View>

        {/* 로그인 폼 */}
        <Animated.View
          style={[styles.formSection, {transform: [{translateX: shakeAnim}]}]}>
          <Text style={styles.formTitle}>로그인</Text>

          {/* 이메일 입력 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>이메일</Text>
            <View style={[styles.inputWrapper, displayError && !email ? styles.inputError : null]}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.textInput}
                placeholder="example@email.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setLocalError('');
                  clearError();
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
          </View>

          {/* 비밀번호 입력 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>비밀번호</Text>
            <View style={[styles.inputWrapper, displayError && !password ? styles.inputError : null]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                ref={passwordRef}
                style={styles.textInput}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setLocalError('');
                  clearError();
                }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Text style={styles.eyeIcon}>
                  {showPassword ? '👁️' : '🙈'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 에러 메시지 */}
          {displayError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          {/* 로그인 버튼 */}
          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
            activeOpacity={0.8}
            disabled={isLoading}
            onPress={handleLogin}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginBtnText}>로그인</Text>
            )}
          </TouchableOpacity>

          {/* 비밀번호 찾기 */}
          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 구분선 */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 소셜 로그인 (목업) */}
        <View style={styles.socialSection}>
          <TouchableOpacity style={styles.socialBtn}>
            <Text style={styles.socialIcon}>🟡</Text>
            <Text style={styles.socialText}>카카오로 시작하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, styles.socialBtnNaver]}>
            <Text style={styles.socialIcon}>🟢</Text>
            <Text style={[styles.socialText, {color: '#FFFFFF'}]}>네이버로 시작하기</Text>
          </TouchableOpacity>
        </View>

        {/* 회원가입 링크 */}
        <View style={styles.signUpRow}>
          <Text style={styles.signUpText}>아직 계정이 없으신가요? </Text>
          <TouchableOpacity onPress={() => {
            clearError();
            setLocalError('');
            navigation.navigate('SignUp');
          }}>
            <Text style={styles.signUpLink}>회원가입</Text>
          </TouchableOpacity>
        </View>

        {/* 테스트 계정 안내 */}
        <View style={styles.testAccountBox}>
          <Text style={styles.testAccountTitle}>🧪 테스트 계정</Text>
          <Text style={styles.testAccountInfo}>이메일: kim@energy.com</Text>
          <Text style={styles.testAccountInfo}>비밀번호: 1234</Text>
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#22C55E',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  appTagline: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  // Form
  formSection: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 52,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
  },
  eyeIcon: {
    fontSize: 18,
    paddingLeft: 8,
  },
  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  // Login button
  loginBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#22C55E',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  // Forgot
  forgotBtn: {
    alignItems: 'center',
    marginTop: 14,
  },
  forgotText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#9CA3AF',
  },
  // Social
  socialSection: {
    gap: 10,
    marginBottom: 28,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE500',
    borderRadius: 14,
    height: 50,
    gap: 8,
  },
  socialBtnNaver: {
    backgroundColor: '#03C75A',
  },
  socialIcon: {
    fontSize: 18,
  },
  socialText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  // Sign up
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signUpText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22C55E',
  },
  // Test account
  testAccountBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  testAccountTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 4,
  },
  testAccountInfo: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
});

export default LoginScreen;
