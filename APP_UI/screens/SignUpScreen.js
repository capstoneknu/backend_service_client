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

const locations = ['강원도 춘천시', '강원도 원주시', '강원도 강릉시', '강원도 속초시', '강원도 동해시'];
const householdOptions = ['1인 가구', '2인 가구', '3인 가구', '4인 가구', '5인 이상'];

const SignUpScreen = ({navigation}) => {
  const {signUp, isLoading, error, clearError} = useAuthStore();

  // 단계: 1=기본정보, 2=추가정보
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    location: '',
    household: '',
  });
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const passwordRef = useRef(null);
  const passwordConfirmRef = useRef(null);
  const nameRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const updateForm = (key, value) => {
    setForm({...form, [key]: value});
    setLocalError('');
    clearError();
  };

  // Step 1 유효성 검사
  const validateStep1 = () => {
    if (!form.email.trim()) {
      setLocalError('이메일을 입력해주세요.');
      return false;
    }
    if (!form.email.includes('@')) {
      setLocalError('올바른 이메일 형식이 아닙니다.');
      return false;
    }
    if (!form.password) {
      setLocalError('비밀번호를 입력해주세요.');
      return false;
    }
    if (form.password.length < 4) {
      setLocalError('비밀번호는 4자리 이상이어야 합니다.');
      return false;
    }
    if (form.password !== form.passwordConfirm) {
      setLocalError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    return true;
  };

  // Step 2 유효성 검사
  const validateStep2 = () => {
    if (!form.name.trim()) {
      setLocalError('이름을 입력해주세요.');
      return false;
    }
    if (!form.location) {
      setLocalError('지역을 선택해주세요.');
      return false;
    }
    if (!form.household) {
      setLocalError('가구 유형을 선택해주세요.');
      return false;
    }
    return true;
  };

  const goToStep2 = () => {
    if (!validateStep1()) return;
    // 페이드 애니메이션
    Animated.timing(fadeAnim, {toValue: 0, duration: 150, useNativeDriver: true}).start(() => {
      setStep(2);
      Animated.timing(fadeAnim, {toValue: 1, duration: 200, useNativeDriver: true}).start();
    });
  };

  const goBackToStep1 = () => {
    setLocalError('');
    Animated.timing(fadeAnim, {toValue: 0, duration: 150, useNativeDriver: true}).start(() => {
      setStep(1);
      Animated.timing(fadeAnim, {toValue: 1, duration: 200, useNativeDriver: true}).start();
    });
  };

  const handleSignUp = async () => {
    if (!validateStep2()) return;

    const result = await signUp({
      email: form.email,
      password: form.password,
      name: form.name,
      location: form.location,
      household: form.household,
    });

    if (result.success) {
      navigation.navigate('SignUpComplete', {name: form.name});
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

        {/* 상단 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => step === 1 ? navigation.goBack() : goBackToStep1()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
          </View>
          <View style={{width: 40}} />
        </View>

        {/* 로고 */}
        <View style={styles.titleSection}>
          <View style={styles.logoMini}>
            <Text style={{fontSize: 24}}>🌿</Text>
          </View>
          <Text style={styles.pageTitle}>
            {step === 1 ? '계정 만들기' : '프로필 설정'}
          </Text>
          <Text style={styles.pageSubtitle}>
            {step === 1
              ? '에너지 절약을 시작하기 위한 첫 걸음이에요'
              : '맞춤형 에너지 관리를 위해 정보를 입력해주세요'}
          </Text>
        </View>

        {/* 폼 영역 */}
        <Animated.View style={[styles.formSection, {opacity: fadeAnim}]}>
          {step === 1 ? (
            <>
              {/* Step 1: 이메일, 비밀번호 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>이메일</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>📧</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="example@email.com"
                    placeholderTextColor="#9CA3AF"
                    value={form.email}
                    onChangeText={v => updateForm('email', v)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>비밀번호</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    ref={passwordRef}
                    style={styles.textInput}
                    placeholder="4자리 이상"
                    placeholderTextColor="#9CA3AF"
                    value={form.password}
                    onChangeText={v => updateForm('password', v)}
                    secureTextEntry={!showPassword}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordConfirmRef.current?.focus()}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Text style={{fontSize: 18}}>{showPassword ? '👁️' : '🙈'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>비밀번호 확인</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    ref={passwordConfirmRef}
                    style={styles.textInput}
                    placeholder="비밀번호를 다시 입력하세요"
                    placeholderTextColor="#9CA3AF"
                    value={form.passwordConfirm}
                    onChangeText={v => updateForm('passwordConfirm', v)}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                  />
                  {form.passwordConfirm && form.password === form.passwordConfirm ? (
                    <Text style={{fontSize: 16, color: '#22C55E'}}>✓</Text>
                  ) : null}
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Step 2: 이름, 지역, 가구 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>이름</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    ref={nameRef}
                    style={styles.textInput}
                    placeholder="이름을 입력하세요"
                    placeholderTextColor="#9CA3AF"
                    value={form.name}
                    onChangeText={v => updateForm('name', v)}
                    returnKeyType="done"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>지역 📍</Text>
                <View style={styles.optionGrid}>
                  {locations.map(loc => (
                    <TouchableOpacity
                      key={loc}
                      style={[
                        styles.optionChip,
                        form.location === loc && styles.optionChipActive,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => updateForm('location', loc)}>
                      <Text style={[
                        styles.optionChipText,
                        form.location === loc && styles.optionChipTextActive,
                      ]}>
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>가구 유형 🏠</Text>
                <View style={styles.optionGrid}>
                  {householdOptions.map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.optionChip,
                        form.household === opt && styles.optionChipActive,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => updateForm('household', opt)}>
                      <Text style={[
                        styles.optionChipText,
                        form.household === opt && styles.optionChipTextActive,
                      ]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* 에러 메시지 */}
          {displayError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          {/* 다음/가입 버튼 */}
          <TouchableOpacity
            style={[styles.nextBtn, isLoading && styles.nextBtnDisabled]}
            activeOpacity={0.8}
            disabled={isLoading}
            onPress={step === 1 ? goToStep2 : handleSignUp}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.nextBtnText}>
                {step === 1 ? '다음' : '가입하기'}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* 로그인 링크 */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>이미 계정이 있으신가요? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.loginLink}>로그인</Text>
          </TouchableOpacity>
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  scrollContent: {paddingHorizontal: 24, paddingTop: 50},
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backIcon: {fontSize: 20, color: '#374151'},
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
  },
  stepDotActive: {
    backgroundColor: '#22C55E',
  },
  stepLine: {
    width: 40,
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  stepLineActive: {
    backgroundColor: '#22C55E',
  },
  // Title
  titleSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoMini: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Form
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
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
  // Option chips
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  optionChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#22C55E',
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  optionChipTextActive: {
    color: '#16A34A',
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
  errorIcon: {fontSize: 14, marginRight: 8},
  errorText: {flex: 1, fontSize: 13, color: '#DC2626', fontWeight: '500'},
  // Next button
  nextBtn: {
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
  nextBtnDisabled: {opacity: 0.7},
  nextBtnText: {color: '#FFFFFF', fontSize: 17, fontWeight: '700'},
  // Login link
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {fontSize: 14, color: '#6B7280'},
  loginLink: {fontSize: 14, fontWeight: '700', color: '#22C55E'},
});

export default SignUpScreen;
