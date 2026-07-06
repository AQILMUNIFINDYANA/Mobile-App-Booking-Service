import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { supabase } from '../../services/supabaseClient'

interface Service {
  id: string
  title: string
  description: string
  price: number
  estimated_duration: number
}

export const ServiceCatalogScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, title, description, price, estimated_duration')
          .order('title', { ascending: true })

        if (error) throw error
        setServices(data || [])
      } catch (error) {
        console.log('Error fetching services:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#F59E0B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Catalog</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerCard}>
          <Text style={styles.title}>All Services</Text>
          <Text style={styles.subtitle}>Detailed catalog of what we offer</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F59E0B" />
          </View>
        ) : (
          <View style={styles.catalogList}>
            {services.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                </View>

                <Text style={styles.serviceDescription}>
                  {service.description || 'No description available.'}
                </Text>

                <View style={styles.serviceMeta}>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="cash" size={16} color="#F59E0B" />
                    <View>
                      <Text style={styles.metaLabel}>Price</Text>
                      <Text style={styles.metaValue}>Rp {service.price.toLocaleString('id-ID')}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color="#a67cfe" />
                    <View>
                      <Text style={styles.metaLabel}>Duration</Text>
                      <Text style={styles.metaValue}>{service.estimated_duration} min</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.bookButton}
                  onPress={() => navigation.navigate('Booking', { preselectedService: service })}
                >
                  <Text style={styles.bookButtonText}>Book This Service</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  headerCard: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#b0b0b0',
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  catalogList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  serviceCard: {
    backgroundColor: 'rgba(34, 37, 45, 0.65)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#F59E0B',
    lineHeight: 20,
    marginBottom: 20,
  },
  serviceMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 11,
    color: '#8a8a8a',
    fontWeight: '500',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  bookButton: {
    backgroundColor: '#1A1D24',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    height: 40,
  },
})
