package com.pocketforge.shared.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen

class EditorScreen : Screen {
    @Composable
    override fun Content() {
        var code by remember { mutableStateOf("// Write your code here") }

        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Text("Code Editor", style = MaterialTheme.typography.headlineMedium)
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedTextField(
                value = code,
                onValueChange = { code = it },
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                maxLines = Int.MAX_VALUE
            )
        }
    }
}