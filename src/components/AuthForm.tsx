import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { TextInput, Button } from 'react-native-paper'

interface AuthFormProps {
  title: string
  onSubmit: (credentials: Record<string, string>) => void
  fields: {
    name: string
    label: string
    placeholder: string
    secureTextEntry?: boolean
  }[]
  isLoading?: boolean
  buttonText?: string
  errorMessage?: string | null
}

export const AuthForm: React.FC<AuthFormProps> = ({
  title,
  onSubmit,
  fields,
  isLoading = false,
  buttonText = 'Submit',
  errorMessage = null,
}) => {
  const [values, setValues] = React.useState<Record<string, string>>(
    fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
  )

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    onSubmit(values)
  }

  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {fields.map((field) => (
        <View key={field.name} style={styles.inputContainer}>
          <TextInput
            label={field.label}
            placeholder={field.placeholder}
            value={values[field.name]}
            onChangeText={(text) => handleChange(field.name, text)}
            secureTextEntry={field.secureTextEntry}
            style={[styles.input, { color: '#F9FAFB' }]}
            mode="outlined"
            editable={!isLoading}
            outlineColor="rgba(255, 255, 255, 0.1)"
            activeOutlineColor="#F59E0B"
            textColor="#F9FAFB"
            placeholderTextColor="#9CA3AF"
            cursorColor="#F59E0B"
            theme={{
              colors: {
                primary: '#F59E0B',
                onSurfaceVariant: '#9CA3AF',
                background: 'rgba(26, 29, 36, 0.95)',
                surface: 'rgba(26, 29, 36, 0.95)',
              },
              roundness: 12,
            }}
          />
        </View>
      ))}

      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
        buttonColor="#F59E0B"
        textColor="#ffffff"
        labelStyle={styles.buttonLabel}
      >
        {buttonText}
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginTop: -4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    color: '#F9FAFB',
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginVertical: 4,
  },
  input: {
    backgroundColor: 'rgba(26, 29, 36, 0.95)',
    fontSize: 15,
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
    borderRadius: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
})
