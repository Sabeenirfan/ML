import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, type ViewStyle, type DimensionValue } from 'react-native';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width: skeletonWidth = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(shimmerAnimation, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnimation]);

  const translateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[styles.skeleton, { width: skeletonWidth as DimensionValue, height, borderRadius }, style]}>
      <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]} />
    </View>
  );
};

export const RecipeCardSkeleton: React.FC = () => (
  <View style={styles.card}>
    <Skeleton width="100%" height={120} borderRadius={12} style={styles.imageSkeleton} />
    <View style={styles.cardContent}>
      <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={14} style={{ marginBottom: 12 }} />
      <View style={styles.metaRow}>
        <Skeleton width={60} height={12} />
        <Skeleton width={80} height={12} />
      </View>
    </View>
  </View>
);

export const RecipeGridSkeleton: React.FC = () => (
  <View style={styles.gridCard}>
    <Skeleton width="100%" height={120} borderRadius={12} />
    <View style={{ padding: 12 }}>
      <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
      <Skeleton width="70%" height={12} style={{ marginBottom: 8 }} />
      <View style={styles.metaRow}>
        <Skeleton width={40} height={12} />
        <Skeleton width={50} height={12} />
      </View>
    </View>
  </View>
);

export const ListItemSkeleton: React.FC = () => (
  <View style={styles.listItem}>
    <Skeleton width={100} height={100} borderRadius={12} />
    <View style={styles.listItemContent}>
      <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="80%" height={14} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={12} />
    </View>
  </View>
);

export const DetailHeaderSkeleton: React.FC = () => (
  <View style={styles.detailHeader}>
    <Skeleton width="100%" height={250} borderRadius={0} />
    <View style={{ padding: 16 }}>
      <Skeleton width="100%" height={24} style={{ marginBottom: 12 }} />
      <Skeleton width="70%" height={18} style={{ marginBottom: 16 }} />
      <View style={styles.metaRow}>
        <Skeleton width={80} height={14} />
        <Skeleton width={100} height={14} />
        <Skeleton width={60} height={14} />
      </View>
    </View>
  </View>
);

export const CategoryPillSkeleton: React.FC = () => (
  <Skeleton width={100} height={40} borderRadius={20} style={{ marginRight: 8 }} />
);

interface SkeletonListProps {
  count?: number;
  type?: 'card' | 'grid' | 'list' | 'category';
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ count = 3, type = 'card' }) => {
  const SkeletonComponent = {
    card: RecipeCardSkeleton,
    grid: RecipeGridSkeleton,
    list: ListItemSkeleton,
    category: CategoryPillSkeleton,
  }[type];

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  skeleton: { backgroundColor: '#E0E0E0', overflow: 'hidden' },
  shimmer: { width: '100%', height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
  },
  cardContent: { padding: 12 },
  gridCard: {
    backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
  },
  listItem: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
    marginBottom: 12, padding: 12, elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  listItemContent: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  detailHeader: { backgroundColor: '#fff' },
  metaRow: { flexDirection: 'row', gap: 12 },
  imageSkeleton: { marginBottom: 0 },
});
