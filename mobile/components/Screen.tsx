import { ScrollView, View, StyleSheet, type ScrollViewProps } from 'react-native';
import { MobileHeader } from '@/components/MobileHeader';
import { useTheme } from '@/hooks/useTheme';

interface ScreenProps extends ScrollViewProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showHeaderActions?: boolean;
}

export function Screen({ title, subtitle, children, showHeaderActions = true, ...scrollProps }: ScreenProps) {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <MobileHeader title={title} subtitle={subtitle} showActions={showHeaderActions} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, scrollProps.contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
});
