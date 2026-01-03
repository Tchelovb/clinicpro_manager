/**
 * 🛡️ VAULT DE COMPONENTES COMPARTILHADOS (PROTEGIDO)
 * 
 * Este arquivo funciona como o ponto central de acesso para os componentes
 * de "Elite Performance" e "Apple Design System".
 * 
 * DIRETRIZES DE PRESERVAÇÃO:
 * 1. Não mova fisicamente os arquivos originais sem refatorar 100% dos imports.
 * 2. Novos recursos devem importar destes exports centralizados quando possível.
 * 3. A MobileTabBar e MobileDrawer são componentes IMUTÁVEIS no design current.
 */

export { MobileDrawer } from '../ui/MobileDrawer';
export { MobileTabBar } from '../ui/MobileTabBar';
export { TasksDrawer } from '../tasks/TasksDrawer';
export { ProfessionalsDrawer } from '../agenda/ProfessionalsDrawer';
