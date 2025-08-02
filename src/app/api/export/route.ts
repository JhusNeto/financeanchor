import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function POST(request: NextRequest) {
  try {
    const { type, userId } = await request.json();

    console.log('🚀 Iniciando exportação:', { type, userId });

    if (!userId) {
      console.log('❌ Usuário não autenticado');
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    // Criar cliente Supabase apenas quando necessário
    const supabase = createSupabaseClient();
    console.log('🔗 Cliente Supabase criado');

    // Buscar todos os dados do usuário
    const userData = await fetchUserData(supabase, userId);
    console.log('✅ Dados do usuário buscados com sucesso');

    switch (type) {
      case 'json':
        console.log('📄 Gerando JSON...');
        return exportToJSON(userData);
      case 'excel':
        console.log('📊 Gerando Excel...');
        return exportToExcel(userData);
      case 'pdf':
        console.log('📋 Gerando PDF...');
        return exportToPDF(userData);
      default:
        console.log('❌ Tipo de exportação inválido:', type);
        return NextResponse.json({ error: 'Tipo de exportação inválido' }, { status: 400 });
    }
  } catch (error) {
    console.error('💥 Erro na exportação:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

async function fetchUserData(supabase: any, userId: string) {
  console.log('🔍 Buscando dados para userId:', userId);
  
  // Buscar dados do usuário
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  console.log('📋 Perfil encontrado:', profile);
  console.log('❌ Erro do perfil:', profileError);

  // Se não encontrou perfil, tentar criar um
  let finalProfile = profile;
  if (!profile && !profileError?.code?.includes('PGRST116')) {
    console.log('⚠️ Perfil não encontrado, tentando criar...');
    
    // Buscar dados do auth.users
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    console.log('🔐 Dados do auth:', authUser);
    console.log('❌ Erro do auth:', authError);
    
    if (authUser?.user) {
      // Tentar inserir perfil
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: authUser.user.user_metadata?.full_name || 'Usuário',
          email: authUser.user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      console.log('✅ Novo perfil criado:', newProfile);
      console.log('❌ Erro ao criar perfil:', insertError);
      
      finalProfile = newProfile;
    }
  }

  // Buscar despesas
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  console.log('💰 Despesas encontradas:', expenses?.length || 0);
  console.log('❌ Erro das despesas:', expensesError);

  // Buscar orçamentos
  const { data: budgets, error: budgetsError } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  console.log('📋 Orçamentos encontrados:', budgets?.length || 0);
  console.log('❌ Erro dos orçamentos:', budgetsError);

  // Buscar dívidas
  const { data: debts, error: debtsError } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  console.log('💳 Dívidas encontradas:', debts?.length || 0);
  console.log('❌ Erro das dívidas:', debtsError);

  // Buscar metas
  const { data: goals, error: goalsError } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  console.log('🎯 Metas encontradas:', goals?.length || 0);
  console.log('❌ Erro das metas:', goalsError);

  // Buscar insights
  const { data: insights, error: insightsError } = await supabase
    .from('daily_insights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  console.log('📊 Insights encontrados:', insights?.length || 0);
  console.log('❌ Erro dos insights:', insightsError);

  // Se ainda não encontrou perfil, criar um padrão
  if (!finalProfile) {
    console.log('⚠️ Criando perfil padrão...');
    finalProfile = {
      id: userId,
      full_name: 'Usuário',
      email: 'usuario@exemplo.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  const result = {
    profile: finalProfile,
    expenses: expenses || [],
    budgets: budgets || [],
    debts: debts || [],
    goals: goals || [],
    insights: insights || [],
    exportDate: new Date().toISOString(),
    totalRecords: {
      expenses: expenses?.length || 0,
      budgets: budgets?.length || 0,
      debts: debts?.length || 0,
      goals: goals?.length || 0,
      insights: insights?.length || 0,
    }
  };

  console.log('📦 Dados finais preparados:', {
    profile: result.profile,
    totalRecords: result.totalRecords
  });

  return result;
}

function exportToJSON(userData: any) {
  const jsonData = JSON.stringify(userData, null, 2);
  const buffer = Buffer.from(jsonData, 'utf-8');
  
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="financeanchor-data.json"',
    },
  });
}

function exportToExcel(userData: any) {
  const workbook = XLSX.utils.book_new();

  // ===== PLANILHA DE RESUMO EXECUTIVO =====
  const summaryData = [
    ['RELATÓRIO FINANCEIRO - FINANCEANCHOR'],
    [''],
    ['INFORMAÇÕES DO USUÁRIO'],
    ['Nome:', userData.profile?.full_name || 'N/A'],
    ['Email:', userData.profile?.email || 'N/A'],
    ['Data de Exportação:', new Date().toLocaleString('pt-BR')],
    [''],
    ['RESUMO GERAL'],
    ['Categoria', 'Quantidade', 'Valor Total'],
    ['Despesas', userData.totalRecords.expenses, '=SUM(Despesas!C:C)'],
    ['Orçamentos', userData.totalRecords.budgets, '=SUM(Orçamentos!C:C)'],
    ['Dívidas', userData.totalRecords.debts, '=SUM(Dívidas!C:C)'],
    ['Metas', userData.totalRecords.goals, '=SUM(Metas!D:D)'],
    ['Insights', userData.totalRecords.insights, '-'],
    [''],
    ['ANÁLISE POR CATEGORIA'],
    ['Categoria', 'Total de Registros', 'Valor Médio'],
    ['Alimentação', userData.expenses.filter((e: any) => e.category === 'alimentacao').length, '=AVERAGEIF(Despesas!D:D,"alimentacao",Despesas!C:C)'],
    ['Transporte', userData.expenses.filter((e: any) => e.category === 'transporte').length, '=AVERAGEIF(Despesas!D:D,"transporte",Despesas!C:C)'],
    ['Lazer', userData.expenses.filter((e: any) => e.category === 'lazer').length, '=AVERAGEIF(Despesas!D:D,"lazer",Despesas!C:C)'],
    ['Saúde', userData.expenses.filter((e: any) => e.category === 'saude').length, '=AVERAGEIF(Despesas!D:D,"saude",Despesas!C:C)'],
    ['Educação', userData.expenses.filter((e: any) => e.category === 'educacao').length, '=AVERAGEIF(Despesas!D:D,"educacao",Despesas!C:C)'],
    ['Outros', userData.expenses.filter((e: any) => !['alimentacao', 'transporte', 'lazer', 'saude', 'educacao'].includes(e.category)).length, '=AVERAGEIF(Despesas!D:D,"outros",Despesas!C:C)'],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Formatação do cabeçalho
  summarySheet['A1'].s = { font: { bold: true, size: 16 }, alignment: { horizontal: 'center' } };
  summarySheet['A3'].s = { font: { bold: true, size: 14 } };
  summarySheet['A8'].s = { font: { bold: true, size: 14 } };
  summarySheet['A9'].s = { font: { bold: true } };
  summarySheet['B9'].s = { font: { bold: true } };
  summarySheet['C9'].s = { font: { bold: true } };
  summarySheet['A17'].s = { font: { bold: true, size: 14 } };
  summarySheet['A18'].s = { font: { bold: true } };
  summarySheet['B18'].s = { font: { bold: true } };
  summarySheet['C18'].s = { font: { bold: true } };
  
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo Executivo');

  // ===== PLANILHA DE DESPESAS DETALHADA =====
  if (userData.expenses.length > 0) {
    const expensesData = [
      ['DESPESAS DETALHADAS'],
      [''],
      ['ID', 'Descrição', 'Valor (R$)', 'Categoria', 'Tipo', 'Data', 'Mês/Ano', 'Criado em']
    ];
    
    userData.expenses.forEach((expense: any) => {
      const date = new Date(expense.created_at);
      expensesData.push([
        expense.id,
        expense.description,
        expense.amount,
        expense.category,
        expense.type,
        date.toLocaleDateString('pt-BR'),
        `${date.getMonth() + 1}/${date.getFullYear()}`,
        date.toLocaleString('pt-BR')
      ]);
    });
    
    const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData);
    expensesSheet['A1'].s = { font: { bold: true, size: 16 }, alignment: { horizontal: 'center' } };
    expensesSheet['A3'].s = { font: { bold: true } };
    expensesSheet['B3'].s = { font: { bold: true } };
    expensesSheet['C3'].s = { font: { bold: true } };
    expensesSheet['D3'].s = { font: { bold: true } };
    expensesSheet['E3'].s = { font: { bold: true } };
    expensesSheet['F3'].s = { font: { bold: true } };
    expensesSheet['G3'].s = { font: { bold: true } };
    expensesSheet['H3'].s = { font: { bold: true } };
    
    XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Despesas');
  }

  // ===== PLANILHA DE ORÇAMENTOS =====
  if (userData.budgets.length > 0) {
    const budgetsData = [
      ['ORÇAMENTOS'],
      [''],
      ['ID', 'Nome', 'Valor (R$)', 'Categoria', 'Período', 'Data de Criação', 'Status']
    ];
    
    userData.budgets.forEach((budget: any) => {
      const date = new Date(budget.created_at);
      budgetsData.push([
        budget.id,
        budget.name,
        budget.amount,
        budget.category,
        budget.period,
        date.toLocaleDateString('pt-BR'),
        budget.status || 'Ativo'
      ]);
    });
    
    const budgetsSheet = XLSX.utils.aoa_to_sheet(budgetsData);
    budgetsSheet['A1'].s = { font: { bold: true, size: 16 }, alignment: { horizontal: 'center' } };
    budgetsSheet['A3'].s = { font: { bold: true } };
    budgetsSheet['B3'].s = { font: { bold: true } };
    budgetsSheet['C3'].s = { font: { bold: true } };
    budgetsSheet['D3'].s = { font: { bold: true } };
    budgetsSheet['E3'].s = { font: { bold: true } };
    budgetsSheet['F3'].s = { font: { bold: true } };
    budgetsSheet['G3'].s = { font: { bold: true } };
    
    XLSX.utils.book_append_sheet(workbook, budgetsSheet, 'Orçamentos');
  }

  // ===== PLANILHA DE DÍVIDAS =====
  if (userData.debts.length > 0) {
    const debtsData = [
      ['DÍVIDAS E PARCELAMENTOS'],
      [''],
      ['ID', 'Descrição', 'Valor Total (R$)', 'Valor Pago (R$)', 'Valor Restante (R$)', 'Parcelas', 'Data de Vencimento', 'Status', 'Progresso (%)']
    ];
    
    userData.debts.forEach((debt: any) => {
      const progress = debt.total_amount > 0 ? Math.round((debt.paid_amount / debt.total_amount) * 100) : 0;
      const dueDate = debt.due_date ? new Date(debt.due_date).toLocaleDateString('pt-BR') : 'N/A';
      
      debtsData.push([
        debt.id,
        debt.description,
        debt.total_amount,
        debt.paid_amount,
        debt.remaining_amount,
        debt.installments,
        dueDate,
        debt.status,
        `${progress}%`
      ]);
    });
    
    const debtsSheet = XLSX.utils.aoa_to_sheet(debtsData);
    debtsSheet['A1'].s = { font: { bold: true, size: 16 }, alignment: { horizontal: 'center' } };
    debtsSheet['A3'].s = { font: { bold: true } };
    debtsSheet['B3'].s = { font: { bold: true } };
    debtsSheet['C3'].s = { font: { bold: true } };
    debtsSheet['D3'].s = { font: { bold: true } };
    debtsSheet['E3'].s = { font: { bold: true } };
    debtsSheet['F3'].s = { font: { bold: true } };
    debtsSheet['G3'].s = { font: { bold: true } };
    debtsSheet['H3'].s = { font: { bold: true } };
    debtsSheet['I3'].s = { font: { bold: true } };
    
    XLSX.utils.book_append_sheet(workbook, debtsSheet, 'Dívidas');
  }

  // ===== PLANILHA DE METAS =====
  if (userData.goals.length > 0) {
    const goalsData = [
      ['METAS FINANCEIRAS'],
      [''],
      ['ID', 'Nome', 'Valor Meta (R$)', 'Valor Atual (R$)', 'Progresso (%)', 'Data Limite', 'Status', 'Restante (R$)', 'Dias Restantes']
    ];
    
    userData.goals.forEach((goal: any) => {
      const progress = goal.target_amount > 0 ? Math.round((goal.current_amount / goal.target_amount) * 100) : 0;
      const remaining = goal.target_amount - goal.current_amount;
      const deadline = goal.deadline ? new Date(goal.deadline) : null;
      const daysLeft = deadline ? Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 'N/A';
      
      goalsData.push([
        goal.id,
        goal.name,
        goal.target_amount,
        goal.current_amount,
        `${progress}%`,
        goal.deadline ? new Date(goal.deadline).toLocaleDateString('pt-BR') : 'N/A',
        goal.status,
        remaining,
        daysLeft
      ]);
    });
    
    const goalsSheet = XLSX.utils.aoa_to_sheet(goalsData);
    goalsSheet['A1'].s = { font: { bold: true, size: 16 }, alignment: { horizontal: 'center' } };
    goalsSheet['A3'].s = { font: { bold: true } };
    goalsSheet['B3'].s = { font: { bold: true } };
    goalsSheet['C3'].s = { font: { bold: true } };
    goalsSheet['D3'].s = { font: { bold: true } };
    goalsSheet['E3'].s = { font: { bold: true } };
    goalsSheet['F3'].s = { font: { bold: true } };
    goalsSheet['G3'].s = { font: { bold: true } };
    goalsSheet['H3'].s = { font: { bold: true } };
    goalsSheet['I3'].s = { font: { bold: true } };
    
    XLSX.utils.book_append_sheet(workbook, goalsSheet, 'Metas');
  }

  // ===== PLANILHA DE INSIGHTS =====
  if (userData.insights.length > 0) {
    const insightsData = [
      ['INSIGHTS E ANÁLISES'],
      [''],
      ['ID', 'Tipo', 'Título', 'Descrição', 'Valor', 'Data', 'Criado em']
    ];
    
    userData.insights.forEach((insight: any) => {
      const date = new Date(insight.created_at);
      insightsData.push([
        insight.id,
        insight.type,
        insight.title,
        insight.description,
        insight.value,
        date.toLocaleDateString('pt-BR'),
        date.toLocaleString('pt-BR')
      ]);
    });
    
    const insightsSheet = XLSX.utils.aoa_to_sheet(insightsData);
    insightsSheet['A1'].s = { font: { bold: true, size: 16 }, alignment: { horizontal: 'center' } };
    insightsSheet['A3'].s = { font: { bold: true } };
    insightsSheet['B3'].s = { font: { bold: true } };
    insightsSheet['C3'].s = { font: { bold: true } };
    insightsSheet['D3'].s = { font: { bold: true } };
    insightsSheet['E3'].s = { font: { bold: true } };
    insightsSheet['F3'].s = { font: { bold: true } };
    insightsSheet['G3'].s = { font: { bold: true } };
    
    XLSX.utils.book_append_sheet(workbook, insightsSheet, 'Insights');
  }

  // ===== PLANILHA DE ANÁLISE MENSUAL =====
  const monthlyAnalysis = [
    ['ANÁLISE MENSUAL'],
    [''],
    ['Mês/Ano', 'Total Despesas', 'Total Orçamentos', 'Total Dívidas', 'Metas Ativas', 'Saldo']
  ];
  
  // Agrupar por mês
  const monthlyData: { [key: string]: any } = {};
  
  userData.expenses.forEach((expense: any) => {
    const date = new Date(expense.created_at);
    const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
    if (!monthlyData[monthKey]) monthlyData[monthKey] = { expenses: 0, budgets: 0, debts: 0, goals: 0 };
    monthlyData[monthKey].expenses += expense.amount;
  });
  
  userData.budgets.forEach((budget: any) => {
    const date = new Date(budget.created_at);
    const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
    if (!monthlyData[monthKey]) monthlyData[monthKey] = { expenses: 0, budgets: 0, debts: 0, goals: 0 };
    monthlyData[monthKey].budgets += budget.amount;
  });
  
  userData.debts.forEach((debt: any) => {
    const date = new Date(debt.created_at);
    const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
    if (!monthlyData[monthKey]) monthlyData[monthKey] = { expenses: 0, budgets: 0, debts: 0, goals: 0 };
    monthlyData[monthKey].debts += debt.total_amount;
  });
  
  Object.keys(monthlyData).sort().forEach(month => {
    const data = monthlyData[month];
    monthlyAnalysis.push([
      month,
      data.expenses,
      data.budgets,
      data.debts,
      data.goals,
      `=${data.budgets}-${data.expenses}`
    ]);
  });
  
  const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyAnalysis);
  monthlySheet['A1'].s = { font: { bold: true, size: 16 }, alignment: { horizontal: 'center' } };
  monthlySheet['A3'].s = { font: { bold: true } };
  monthlySheet['B3'].s = { font: { bold: true } };
  monthlySheet['C3'].s = { font: { bold: true } };
  monthlySheet['D3'].s = { font: { bold: true } };
  monthlySheet['E3'].s = { font: { bold: true } };
  monthlySheet['F3'].s = { font: { bold: true } };
  
  XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Análise Mensal');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="financeanchor-data.xlsx"',
    },
  });
}

async function exportToPDF(userData: any) {
  const pdfDoc = await PDFDocument.create();
  
  // ===== PÁGINA 1: CAPA =====
  const coverPage = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = coverPage.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Título principal
  coverPage.drawText('RELATÓRIO FINANCEIRO', {
    x: 50,
    y: height - 100,
    size: 28,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  coverPage.drawText('FinanceAnchor', {
    x: 50,
    y: height - 140,
    size: 20,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  // Informações do usuário
  coverPage.drawText('INFORMAÇÕES DO USUÁRIO', {
    x: 50,
    y: height - 200,
    size: 16,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  coverPage.drawText(`Nome: ${userData.profile?.full_name || 'N/A'}`, {
    x: 50,
    y: height - 230,
    size: 12,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  coverPage.drawText(`Email: ${userData.profile?.email || 'N/A'}`, {
    x: 50,
    y: height - 250,
    size: 12,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  coverPage.drawText(`Data de Exportação: ${new Date().toLocaleString('pt-BR')}`, {
    x: 50,
    y: height - 270,
    size: 12,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  // Resumo executivo
  coverPage.drawText('RESUMO EXECUTIVO', {
    x: 50,
    y: height - 320,
    size: 16,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  const summaryItems = [
    `Total de Despesas: ${userData.totalRecords.expenses}`,
    `Total de Orçamentos: ${userData.totalRecords.budgets}`,
    `Total de Dívidas: ${userData.totalRecords.debts}`,
    `Total de Metas: ${userData.totalRecords.goals}`,
    `Total de Insights: ${userData.totalRecords.insights}`,
  ];
  
  let yPos = height - 350;
  summaryItems.forEach(item => {
    coverPage.drawText(item, {
      x: 50,
      y: yPos,
      size: 11,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
    yPos -= 20;
  });
  
  // Rodapé
  coverPage.drawText('FinanceAnchor - Copiloto Financeiro para Casais', {
    x: 50,
    y: 50,
    size: 10,
    font: font,
    color: rgb(0.6, 0.6, 0.6),
  });
  
  // ===== PÁGINA 2: DESPESAS =====
  if (userData.expenses.length > 0) {
    const expensesPage = pdfDoc.addPage([595, 842]);
    let yPosition = height - 50;
    
    expensesPage.drawText('DESPESAS DETALHADAS', {
      x: 50,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPosition -= 30;
    
    // Cabeçalho da tabela
    expensesPage.drawText('Descrição', {
      x: 50,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    expensesPage.drawText('Valor', {
      x: 250,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    expensesPage.drawText('Categoria', {
      x: 350,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    expensesPage.drawText('Data', {
      x: 450,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    yPosition -= 20;
    
    // Linha separadora
    expensesPage.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: 545, y: yPosition },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    yPosition -= 20;
    
    // Dados das despesas
    const recentExpenses = userData.expenses.slice(0, 25); // Limitar a 25 itens por página
    recentExpenses.forEach((expense: any) => {
      if (yPosition < 100) {
        // Nova página se necessário
        const newPage = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
      }
      
      expensesPage.drawText(expense.description.substring(0, 30), {
        x: 50,
        y: yPosition,
        size: 9,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      expensesPage.drawText(`R$ ${expense.amount.toFixed(2)}`, {
        x: 250,
        y: yPosition,
        size: 9,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      expensesPage.drawText(expense.category, {
        x: 350,
        y: yPosition,
        size: 9,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      expensesPage.drawText(new Date(expense.created_at).toLocaleDateString('pt-BR'), {
        x: 450,
        y: yPosition,
        size: 9,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      yPosition -= 15;
    });
  }
  
  // ===== PÁGINA 3: METAS =====
  if (userData.goals.length > 0) {
    const goalsPage = pdfDoc.addPage([595, 842]);
    let yPosition = height - 50;
    
    goalsPage.drawText('METAS FINANCEIRAS', {
      x: 50,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPosition -= 30;
    
    const activeGoals = userData.goals.filter((goal: any) => goal.status === 'active');
    activeGoals.forEach((goal: any) => {
      if (yPosition < 100) {
        const newPage = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
      }
      
      const progress = Math.round((goal.current_amount / goal.target_amount) * 100);
      
      goalsPage.drawText(goal.name, {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPosition -= 20;
      
      goalsPage.drawText(`Meta: R$ ${goal.target_amount.toFixed(2)}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      goalsPage.drawText(`Atual: R$ ${goal.current_amount.toFixed(2)}`, {
        x: 200,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      goalsPage.drawText(`Progresso: ${progress}%`, {
        x: 350,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPosition -= 25;
      
      // Barra de progresso visual
      const barWidth = 200;
      const barHeight = 8;
      const progressWidth = (progress / 100) * barWidth;
      
      // Fundo da barra
      goalsPage.drawRectangle({
        x: 50,
        y: yPosition - 5,
        width: barWidth,
        height: barHeight,
        color: rgb(0.9, 0.9, 0.9),
      });
      
      // Progresso da barra
      goalsPage.drawRectangle({
        x: 50,
        y: yPosition - 5,
        width: progressWidth,
        height: barHeight,
        color: rgb(0.2, 0.6, 0.2),
      });
      
      yPosition -= 30;
    });
  }
  
  // ===== PÁGINA 4: DÍVIDAS =====
  if (userData.debts.length > 0) {
    const debtsPage = pdfDoc.addPage([595, 842]);
    let yPosition = height - 50;
    
    debtsPage.drawText('DÍVIDAS E PARCELAMENTOS', {
      x: 50,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPosition -= 30;
    
    userData.debts.forEach((debt: any) => {
      if (yPosition < 100) {
        const newPage = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
      }
      
      const progress = debt.total_amount > 0 ? Math.round((debt.paid_amount / debt.total_amount) * 100) : 0;
      
      debtsPage.drawText(debt.description, {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPosition -= 20;
      
      debtsPage.drawText(`Total: R$ ${debt.total_amount.toFixed(2)}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      debtsPage.drawText(`Pago: R$ ${debt.paid_amount.toFixed(2)}`, {
        x: 200,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      debtsPage.drawText(`Restante: R$ ${debt.remaining_amount.toFixed(2)}`, {
        x: 350,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPosition -= 20;
      
      debtsPage.drawText(`Progresso: ${progress}%`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPosition -= 30;
    });
  }
  
  const pdfBytes = await pdfDoc.save();
  
  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="financeanchor-report.pdf"',
    },
  });
} 