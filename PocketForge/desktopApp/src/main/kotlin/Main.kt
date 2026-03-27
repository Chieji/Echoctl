import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import com.pocketforge.shared.App

fun main() = application {
    Window(onCloseRequest = ::exitApplication, title = "PocketForge") {
        App()
    }
}